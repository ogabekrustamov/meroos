"""
Quizzes – views
"""

import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import (
    Quiz, Question, QuestionOption,
    QuizAttempt, QuizAnswer,
    KahootRoom, KahootLeaderboard,
)
from .serializers import (
    QuizListSerializer,
    QuizDetailSerializer,
    QuizWriteSerializer,
    QuizAttemptSerializer,
    QuizAttemptDetailSerializer,
    KahootRoomSerializer,
    KahootRoomCreateSerializer,
    KahootLeaderboardSerializer,
)
from accounts.permissions import CanManageQuizzes, CanHostKahoot

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------
class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageQuizzes]

    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['quiz_type', 'category', 'difficulty', 'is_published']
    search_fields    = ['title', 'description', 'tags']
    ordering_fields  = ['created_at', 'total_attempts', 'average_score']
    ordering         = ['-created_at']

    def get_permissions(self):
        if self.action == 'start_attempt':
            return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and (user.is_superuser or user.is_teacher):
            qs = Quiz.objects.select_related('category', 'created_by')
            if user.is_teacher and not user.is_superuser:
                from django.db.models import Q
                qs = qs.filter(Q(is_published=True) | Q(created_by=user))
            return qs

        return Quiz.objects.select_related('category', 'created_by').filter(is_published=True)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return QuizWriteSerializer
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizListSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # --- start attempt -------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='start-attempt')
    def start_attempt(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        quiz = self.get_object()

        if not quiz.is_published:
            return Response({"detail": "Quiz is not published."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce max_attempts
        if quiz.max_attempts > 0:
            completed = QuizAttempt.objects.filter(
                quiz=quiz, user=request.user, status='completed'
            ).count()
            if completed >= quiz.max_attempts:
                return Response(
                    {"detail": f"Maximum {quiz.max_attempts} attempt(s) reached."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Return existing in-progress attempt if any
        in_progress = QuizAttempt.objects.filter(
            quiz=quiz, user=request.user, status='in_progress'
        ).first()
        if in_progress:
            return Response(QuizAttemptSerializer(in_progress).data)

        attempt_number = QuizAttempt.objects.filter(quiz=quiz, user=request.user).count() + 1

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=request.user,
            attempt_number=attempt_number,
            max_score=quiz.total_points,
        )

        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# QuizAttempt  (list, retrieve, submit-answer, complete)
# ---------------------------------------------------------------------------
class QuizAttemptViewSet(viewsets.GenericViewSet):
    serializer_class   = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return QuizAttempt.objects.select_related('quiz', 'user').all()

        if user.is_teacher:
            from organizations.models import TeacherClassAssignment
            from accounts.models import StudentProfile
            class_ids  = TeacherClassAssignment.objects.filter(
                teacher=user, is_active=True
            ).values_list('class_group_id', flat=True)
            student_ids = StudentProfile.objects.filter(
                class_group_id__in=class_ids
            ).values_list('student_id', flat=True)
            return QuizAttempt.objects.filter(user_id__in=student_ids).select_related('quiz', 'user')

        return QuizAttempt.objects.filter(user=user).select_related('quiz', 'user')

    # helper: fetch attempt by UUID, enforce ownership
    def _get_attempt(self, attempt_id):
        try:
            attempt = QuizAttempt.objects.select_related('quiz', 'user').get(attempt_id=attempt_id)
        except QuizAttempt.DoesNotExist:
            return None, Response({"detail": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        if attempt.user != self.request.user and not self.request.user.is_superuser:
            return None, Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        return attempt, None

    # --- list ----------------------------------------------------------------
    def list(self, request):
        qs = self.get_queryset()
        quiz_id = request.query_params.get('quiz')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(QuizAttemptSerializer(page, many=True).data)
        return Response(QuizAttemptSerializer(qs, many=True).data)

    # --- retrieve ------------------------------------------------------------
    def retrieve(self, request, pk=None):
        attempt, err = self._get_attempt(pk)
        if err:
            return err
        return Response(QuizAttemptSerializer(attempt).data)

    # --- submit-answer -------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='submit-answer')
    def submit_answer(self, request, pk=None):
        attempt, err = self._get_attempt(pk)
        if err:
            return err

        if attempt.status != 'in_progress':
            return Response({"detail": "Attempt is not in progress."}, status=status.HTTP_400_BAD_REQUEST)

        question_id       = request.data.get('question_id')
        selected_option_ids = request.data.get('selected_option_ids', [])
        time_taken        = request.data.get('time_taken', 0)

        if not question_id:
            return Response({"detail": "Provide question_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question = Question.objects.get(id=question_id, quiz=attempt.quiz)
        except Question.DoesNotExist:
            return Response({"detail": "Question not found in this quiz."}, status=status.HTTP_404_NOT_FOUND)

        # Validate option IDs belong to this question
        valid_ids = set(QuestionOption.objects.filter(question=question).values_list('id', flat=True))
        for oid in selected_option_ids:
            if oid not in valid_ids:
                return Response(
                    {"detail": f"Option {oid} does not belong to this question."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Upsert the answer
        answer, created = QuizAnswer.objects.get_or_create(
            attempt=attempt,
            question=question,
            defaults={'time_taken': time_taken},
        )
        if not created:
            answer.time_taken = time_taken
            answer.save(update_fields=['time_taken'])

        answer.selected_options.set(selected_option_ids)
        answer.check_correctness()

        correct_ids = list(
            QuestionOption.objects.filter(question=question, is_correct=True).values_list('id', flat=True)
        )

        return Response({
            'is_correct':        answer.is_correct,
            'points_earned':     answer.points_earned,
            'correct_option_ids': correct_ids,
            'explanation':       question.explanation,
        })

    # --- complete ------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        attempt, err = self._get_attempt(pk)
        if err:
            return err

        if attempt.status != 'in_progress':
            return Response({"detail": "Attempt is not in progress."}, status=status.HTTP_400_BAD_REQUEST)

        attempt.complete()
        attempt.save()

        # Update quiz-level stats
        attempt.quiz.update_statistics()

        # Update student streak and stats
        try:
            profile = attempt.user.student_profile
            profile.update_streak()
            profile.update_stats()

            # Update UserStatistics and all rankings immediately
            from analytics.models import UserStatistics
            from analytics.views import refresh_all_ranks
            user_stats, _ = UserStatistics.objects.get_or_create(user=attempt.user)
            user_stats.update_streak()  # Update streak in UserStatistics too
            user_stats.update_from_attempts()
            refresh_all_ranks(user_stats)
        except Exception:
            pass

        return Response(QuizAttemptSerializer(attempt).data)

    # --- student-attempts (teacher fetches a student's attempts) -------------
    @action(detail=False, methods=['get'], url_path='student-attempts')
    def student_attempts(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"detail": "Provide student_id."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not (user.is_superuser or user.is_teacher):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Verify the teacher owns this student (via class assignments)
        if user.is_teacher and not user.is_superuser:
            from organizations.models import TeacherClassAssignment
            from accounts.models import StudentProfile
            class_ids = TeacherClassAssignment.objects.filter(
                teacher=user, is_active=True
            ).values_list('class_group_id', flat=True)
            if not StudentProfile.objects.filter(
                user_id=student_id, class_group_id__in=class_ids
            ).exists():
                return Response({"detail": "Student not in your classes."}, status=status.HTTP_403_FORBIDDEN)

        attempts = QuizAttempt.objects.filter(
            user_id=student_id
        ).select_related('quiz').order_by('-started_at')

        return Response(QuizAttemptSerializer(attempts, many=True).data)

    # --- attempt detail (full per-question breakdown) ------------------------
    @action(detail=True, methods=['get'], url_path='detail')
    def attempt_detail(self, request, pk=None):
        try:
            attempt = QuizAttempt.objects.select_related(
                'quiz', 'user'
            ).prefetch_related(
                'answers__question__options',
                'answers__selected_options',
            ).get(attempt_id=pk)
        except QuizAttempt.DoesNotExist:
            return Response({"detail": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # Allow: the student who took it, their teacher, or superuser
        if attempt.user != user and not user.is_superuser:
            if not user.is_teacher:
                return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            # Check teacher owns the student
            from organizations.models import TeacherClassAssignment
            from accounts.models import StudentProfile
            class_ids = TeacherClassAssignment.objects.filter(
                teacher=user, is_active=True
            ).values_list('class_group_id', flat=True)
            if not StudentProfile.objects.filter(
                user_id=attempt.user_id, class_group_id__in=class_ids
            ).exists():
                return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        return Response(QuizAttemptDetailSerializer(attempt).data)


# ---------------------------------------------------------------------------
# KahootRoom
# ---------------------------------------------------------------------------
class KahootRoomViewSet(viewsets.GenericViewSet):
    """
    POST   /api/quizzes/kahoot-rooms/              → create
    GET    /api/quizzes/kahoot-rooms/<code>/       → status
    POST   /api/quizzes/kahoot-rooms/<code>/start/ → start
    POST   /api/quizzes/kahoot-rooms/<code>/end/   → end
    GET    /api/quizzes/kahoot-rooms/<code>/leaderboard/
    """

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), CanHostKahoot()]
        if self.action in ('start', 'end'):
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    # --- create --------------------------------------------------------------
    def create(self, request):
        serializer = KahootRoomCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            quiz = Quiz.objects.get(
                pk=serializer.validated_data['quiz_id'],
                quiz_type='kahoot',
                is_published=True,
            )
        except Quiz.DoesNotExist:
            return Response(
                {"detail": "Quiz not found or not a published Kahoot quiz."},
                status=status.HTTP_404_NOT_FOUND,
            )

        room = KahootRoom.objects.create(
            quiz=quiz,
            host=request.user,
            max_players=serializer.validated_data['max_players'],
            allow_late_join=serializer.validated_data['allow_late_join'],
        )

        return Response(KahootRoomSerializer(room).data, status=status.HTTP_201_CREATED)

    # --- retrieve (by room_code) ---------------------------------------------
    def retrieve(self, request, pk=None):
        try:
            room = KahootRoom.objects.select_related('quiz', 'host').get(room_code=pk)
        except KahootRoom.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(KahootRoomSerializer(room).data)

    # --- start ---------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='start')
    def start(self, request, pk=None):
        try:
            room = KahootRoom.objects.get(room_code=pk)
        except KahootRoom.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        if room.host != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the host can start."}, status=status.HTTP_403_FORBIDDEN)

        # If already in progress, return success (idempotent)
        if room.status == 'in_progress':
            return Response(KahootRoomSerializer(room).data)

        if room.status != 'waiting':
            return Response({"detail": "Room is not in waiting state."}, status=status.HTTP_400_BAD_REQUEST)

        room.status   = 'in_progress'
        room.started_at = timezone.now()
        room.current_question_index = 0
        room.save()

        # Broadcast quiz_started event via WebSocket channel layer
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'kahoot_{pk}'
            
            # Get first question data
            questions = list(room.quiz.questions.all().order_by('order'))
            question_data = None
            if questions:
                question = questions[0]
                question_data = {
                    'id': question.id,
                    'text': question.question_text,
                    'image': question.image.url if question.image else None,
                    'type': question.question_type,
                    'points': question.points,
                    'time_limit': room.quiz.time_per_question,
                    'options': [
                        {
                            'id': opt.id,
                            'text': opt.option_text,
                            'image': opt.image.url if opt.image else None
                        }
                        for opt in question.options.all().order_by('order')
                    ],
                    'question_number': 1,
                    'total_questions': len(questions)
                }
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'quiz_started',
                    'question': question_data
                }
            )
        except Exception:
            # Log but don't fail the API call if broadcast fails
            logger.exception("Failed to broadcast quiz_started for room %s", pk)

        return Response(KahootRoomSerializer(room).data)

    # --- end -----------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='end')
    def end(self, request, pk=None):
        try:
            room = KahootRoom.objects.get(room_code=pk)
        except KahootRoom.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        if room.host != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the host can end."}, status=status.HTTP_403_FORBIDDEN)

        if room.status != 'in_progress':
            return Response({"detail": "Room is not in progress."}, status=status.HTTP_400_BAD_REQUEST)

        room.status   = 'completed'
        room.ended_at = timezone.now()
        room.save()

        # Complete every in-progress attempt in this room
        for attempt in QuizAttempt.objects.filter(kahoot_room=room, status='in_progress'):
            attempt.complete()
            attempt.save()

        return Response(KahootRoomSerializer(room).data)

    # --- leaderboard (HTTP fallback; real-time via WebSocket) -----------------
    @action(detail=True, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request, pk=None):
        try:
            room = KahootRoom.objects.get(room_code=pk)
        except KahootRoom.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        # Refresh persisted ranks so the fallback is correct mid-game too
        # (the live WebSocket path ranks in-memory and only persists at end).
        KahootLeaderboard.recompute_ranks(room)
        entries = KahootLeaderboard.objects.filter(room=room).order_by('rank').select_related('user')
        return Response(KahootLeaderboardSerializer(entries, many=True).data)