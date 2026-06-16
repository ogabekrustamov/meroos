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
    LeaderboardEntrySerializer,
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


def _refresh_class_rank(stats: UserStatistics):
    """Recompute class_rank as 1 + count of classmates with a higher average score."""
    try:
        class_group = stats.user.student_profile.class_group
        if not class_group:
            stats.class_rank = None
            stats.save(update_fields=['class_rank'])
            return
        
        # Count students in the same class with higher scores
        stats.class_rank = (
            UserStatistics.objects.filter(
                user__student_profile__class_group=class_group,
                average_score_percentage__gt=stats.average_score_percentage
            ).count()
            + 1
        )
        stats.save(update_fields=['class_rank'])
    except Exception:
        # User might not have a student profile
        stats.class_rank = None
        stats.save(update_fields=['class_rank'])


def _refresh_school_rank(stats: UserStatistics):
    """Recompute school_rank as 1 + count of schoolmates with a higher average score."""
    try:
        school = stats.user.school
        if not school:
            stats.school_rank = None
            stats.save(update_fields=['school_rank'])
            return
        
        # Count students in the same school with higher scores
        stats.school_rank = (
            UserStatistics.objects.filter(
                user__school=school,
                average_score_percentage__gt=stats.average_score_percentage
            ).count()
            + 1
        )
        stats.save(update_fields=['school_rank'])
    except Exception:
        stats.school_rank = None
        stats.save(update_fields=['school_rank'])


def refresh_all_ranks(stats: UserStatistics):
    """Refresh all ranking fields (global, class, school) for a user's stats."""
    _refresh_global_rank(stats)
    _refresh_class_rank(stats)
    _refresh_school_rank(stats)


def sync_streak_from_profile(stats: UserStatistics):
    """
    Sync streak data from StudentProfile to UserStatistics.
    This ensures consistency between teacher view (StudentProfile) and student view (UserStatistics).
    """
    try:
        profile = stats.user.student_profile
        stats.current_streak_days = profile.current_streak
        stats.longest_streak_days = profile.longest_streak
        stats.last_activity_date = profile.last_activity_date
        stats.save(update_fields=['current_streak_days', 'longest_streak_days', 'last_activity_date'])
    except Exception:
        # User might not have a student profile (e.g., teacher or admin)
        pass



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
        refresh_all_ranks(stats)
        sync_streak_from_profile(stats)  # Sync streak from StudentProfile

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
        refresh_all_ranks(stats)

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
            user__is_active=True,
            user__role='student'
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
        # Annotate rank on the fly
        entries = []
        for rank, stats in enumerate(qs, start=1):
            data = LeaderboardEntrySerializer(stats).data
            data['rank'] = rank
            entries.append(data)

        return Response({
            'leaderboard_type': lb_type,
            'period': lb_type if lb_type in ['weekly', 'monthly'] else 'all_time',
            'filters':  {'category': category, 'class': class_id},
            'rankings':  entries,
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

    # === platform-stats (superuser dashboard totals) =========================
    # GET /api/analytics/platform-stats/
    @action(detail=False, methods=['get'], url_path='platform-stats')
    def platform_stats(self, request):
        if not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can view platform statistics."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from accounts.models import User
        from organizations.models import Region, School, ClassGroup
        from quizzes.models import Quiz, QuizAttempt

        # Users broken down by role
        role_rows = User.objects.values('role').annotate(count=Count('id'))
        users_by_role = {row['role']: row['count'] for row in role_rows}

        # Recent activity for a small trend (last 7 days)
        cutoff = (timezone.now() - timezone.timedelta(days=7)).date()
        recent_activity = DailyActivity.objects.filter(
            date__gte=cutoff
        ).order_by('date')

        return Response({
            'users': {
                'total':       User.objects.count(),
                'active':      User.objects.filter(is_active=True).count(),
                'superusers':  users_by_role.get('superuser', 0),
                'teachers':    users_by_role.get('teacher', 0),
                'students':    users_by_role.get('student', 0),
                'guests':      users_by_role.get('guest', 0),
            },
            'organizations': {
                'regions': Region.objects.filter(is_active=True).count(),
                'schools': School.objects.filter(is_active=True).count(),
                'classes': ClassGroup.objects.filter(is_active=True).count(),
            },
            'quizzes': {
                'total':     Quiz.objects.count(),
                'published': Quiz.objects.filter(is_published=True).count(),
                'attempts':  QuizAttempt.objects.count(),
            },
            'recent_activity': DailyActivitySerializer(recent_activity, many=True).data,
        })