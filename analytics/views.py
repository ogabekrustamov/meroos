"""
Analytics – views

All endpoints are custom actions — no default CRUD.
Scoping rules:
  - superuser  → everything
  - teacher    → students in their assigned classes
  - student    → own data only
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count

from .models import (
    UserStatistics,
    CategoryStatistics,
    ClassStatistics,
    QuizStatistics,
    DailyActivity,
)
from .serializers import (
    UserStatisticsSerializer,
    CategoryStatisticsSerializer,
    ClassStatisticsSerializer,
    QuizStatisticsSerializer,
    DailyActivitySerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _refresh_global_rank(stats: UserStatistics):
    """Recompute global_rank as 1 + count of users with a higher average score."""
    stats.global_rank = (
        UserStatistics.objects.filter(
            average_score_percentage__gt=stats.average_score_percentage
        ).count()
        + 1
    )
    stats.save(update_fields=['global_rank'])


def _teacher_owns_student(teacher, student_user):
    """True if teacher is assigned (active) to the student's class."""
    from organizations.models import TeacherClassAssignment
    try:
        class_group = student_user.student_profile.class_group
        if not class_group:
            return False
        return TeacherClassAssignment.objects.filter(
            teacher=teacher,
            class_group=class_group,
            is_active=True,
        ).exists()
    except Exception:
        return False


# ---------------------------------------------------------------------------
# AnalyticsViewSet
# ---------------------------------------------------------------------------
class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # === my-stats ============================================================
    # GET /api/analytics/my-stats/
    @action(detail=False, methods=['get'], url_path='my-stats')
    def my_stats(self, request):
        user = request.user

        # Fetch or create the stats row
        stats, _ = UserStatistics.objects.get_or_create(user=user)
        stats.update_from_attempts()
        _refresh_global_rank(stats)

        # Per-category breakdown
        categories = CategoryStatistics.objects.filter(user=user).select_related('category')
        for cat_stat in categories:
            cat_stat.update_from_attempts()

        return Response({
            'overview':    UserStatisticsSerializer(stats).data,
            'by_category': CategoryStatisticsSerializer(categories, many=True).data,
        })

    # === student-stats (teacher views a specific student) ====================
    # GET /api/analytics/student-stats/<student_user_id>/
    @action(detail=True, methods=['get'], url_path='student-stats')
    def student_stats(self, request, pk=None):
        from accounts.models import User

        # Permission check
        if not request.user.is_superuser:
            if request.user.is_teacher:
                try:
                    if not request.user.teacher_permissions.can_view_student_stats:
                        return Response(
                            {"detail": "Permission denied."},
                            status=status.HTTP_403_FORBIDDEN,
                        )
                except Exception:
                    return Response(
                        {"detail": "Permission denied."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                return Response(
                    {"detail": "Permission denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            student = User.objects.get(pk=pk, role='student')
        except User.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Teacher scope check
        if request.user.is_teacher and not _teacher_owns_student(request.user, student):
            return Response(
                {"detail": "Student is not in any of your assigned classes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        stats, _ = UserStatistics.objects.get_or_create(user=student)
        stats.update_from_attempts()
        _refresh_global_rank(stats)

        categories = CategoryStatistics.objects.filter(user=student).select_related('category')
        for cs in categories:
            cs.update_from_attempts()

        return Response({
            'overview':    UserStatisticsSerializer(stats).data,
            'by_category': CategoryStatisticsSerializer(categories, many=True).data,
        })

    # === class-stats ==========================================================
    # GET /api/analytics/class-stats/<class_group_id>/
    @action(detail=True, methods=['get'], url_path='class-stats')
    def class_stats(self, request, pk=None):
        from organizations.models import ClassGroup, TeacherClassAssignment

        if not request.user.is_superuser and not request.user.is_teacher:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            class_group = ClassGroup.objects.get(pk=pk)
        except ClassGroup.DoesNotExist:
            return Response({"detail": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        # Teacher must be assigned to this class
        if request.user.is_teacher and not request.user.is_superuser:
            if not TeacherClassAssignment.objects.filter(
                teacher=request.user, class_group=class_group, is_active=True
            ).exists():
                return Response(
                    {"detail": "You are not assigned to this class."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Fetch or create class stats and refresh
        class_stat, _ = ClassStatistics.objects.get_or_create(class_group=class_group)
        class_stat.update_statistics()

        # Top 10 students in this class by average score
        top_students = (
            UserStatistics.objects.filter(
                user__student_profile__class_group=class_group,
                user__is_active=True,
            )
            .select_related('user')
            .order_by('-average_score_percentage')[:10]
        )

        return Response({
            'class':         ClassStatisticsSerializer(class_stat).data,
            'top_students':  UserStatisticsSerializer(top_students, many=True).data,
        })

    # === quiz-stats ============================================================
    # GET /api/analytics/quiz-stats/<quiz_id>/
    @action(detail=True, methods=['get'], url_path='quiz-stats')
    def quiz_stats(self, request, pk=None):
        from quizzes.models import Quiz

        try:
            quiz = Quiz.objects.get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only the quiz creator or superuser may view detailed quiz stats
        if not request.user.is_superuser:
            if quiz.created_by != request.user:
                return Response(
                    {"detail": "Permission denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        quiz_stat, _ = QuizStatistics.objects.get_or_create(quiz=quiz)
        quiz_stat.update_statistics()

        return Response(QuizStatisticsSerializer(quiz_stat).data)

    # === leaderboard ===========================================================
    # GET /api/analytics/leaderboard/
    #   ?type=global|weekly|monthly  (default: global)
    #   &category=<id>
    #   &class=<id>
    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request):
        lb_type   = request.query_params.get('type', 'global')   # global | weekly | monthly
        category  = request.query_params.get('category')
        class_id  = request.query_params.get('class')

        qs = UserStatistics.objects.filter(
            user__is_active=True
        ).select_related('user')

        # Filter by category (only count attempts in that category)
        if category:
            # We need users who have activity in this category
            from accounts.models import User
            user_ids = CategoryStatistics.objects.filter(
                category_id=category,
                quizzes_completed__gt=0,
            ).values_list('user_id', flat=True)
            qs = qs.filter(user_id__in=user_ids)

        # Filter by class
        if class_id:
            qs = qs.filter(user__student_profile__class_group_id=class_id)

        # Time-window filter
        if lb_type == 'weekly':
            week_ago = (timezone.now() - timezone.timedelta(weeks=1)).date()
            qs = qs.filter(last_activity_date__gte=week_ago)
        elif lb_type == 'monthly':
            month_ago = (timezone.now() - timezone.timedelta(days=30)).date()
            qs = qs.filter(last_activity_date__gte=month_ago)

        # Sort: total points desc, then average score desc
        qs = qs.order_by('-total_points_earned', '-average_score_percentage')[:100]

        # Annotate rank on the fly
        entries = []
        for rank, stats in enumerate(qs, start=1):
            data = UserStatisticsSerializer(stats).data
            data['leaderboard_rank'] = rank
            entries.append(data)

        return Response({
            'type':     lb_type,
            'filters':  {'category': category, 'class': class_id},
            'entries':  entries,
        })

    # === daily-activity (superuser only) ======================================
    # GET /api/analytics/daily-activity/?days=30
    @action(detail=False, methods=['get'], url_path='daily-activity')
    def daily_activity(self, request):
        if not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can view daily activity."},
                status=status.HTTP_403_FORBIDDEN,
            )

        days = int(request.query_params.get('days', 30))
        cutoff = (timezone.now() - timezone.timedelta(days=days)).date()

        activity = DailyActivity.objects.filter(date__gte=cutoff).order_by('-date')
        return Response(DailyActivitySerializer(activity, many=True).data)