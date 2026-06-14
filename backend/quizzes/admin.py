"""
Quizzes – admin
"""

from django.contrib import admin
from .models import (
    Quiz, Question, QuestionOption,
    QuizAttempt, QuizAnswer,
    KahootRoom, KahootLeaderboard,
)


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------
class QuestionOptionInline(admin.TabularInline):
    model   = QuestionOption
    extra   = 2
    ordering = ('order',)


class QuestionInline(admin.TabularInline):
    model   = Question
    extra   = 0
    fields  = ('order', 'question_text', 'question_type', 'points', 'image')
    ordering = ('order',)


class QuizAnswerInline(admin.TabularInline):
    model           = QuizAnswer
    extra           = 0
    readonly_fields = ('question', 'is_correct', 'points_earned', 'time_taken', 'answered_at')
    fields          = ('question', 'is_correct', 'points_earned', 'time_taken')


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------
@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display        = ('title', 'quiz_type', 'category', 'difficulty', 'is_published',
                           'total_questions', 'total_attempts', 'average_score', 'created_by')
    list_filter         = ('quiz_type', 'category', 'difficulty', 'is_published', 'timing_mode')
    search_fields       = ('title', 'description')
    raw_id_fields       = ('created_by', 'category')
    list_select_related = ('category', 'created_by')
    list_per_page       = 50
    ordering            = ('-created_at',)
    date_hierarchy      = 'created_at'

    inlines = [QuestionInline]

    fieldsets = (
        ('Basic',          {'fields': ('title', 'slug', 'description', 'thumbnail')}),
        ('Classification', {'fields': ('quiz_type', 'category', 'difficulty')}),
        ('Timing',         {'fields': ('timing_mode', 'time_per_question', 'total_time')}),
        ('Scoring',        {'fields': ('passing_score',)}),
        ('Options',        {'fields': (
            'show_correct_answers', 'randomize_questions',
            'randomize_options', 'allow_review', 'max_attempts',
        )}),
        ('Publishing',     {'fields': ('is_published', 'tags')}),
        ('Stats',          {'fields': ('total_attempts', 'average_score'), 'classes': ('collapse',)}),
    )
    readonly_fields     = ('total_attempts', 'average_score')
    prepopulated_fields = {'slug': ('title',)}


# ---------------------------------------------------------------------------
# Question  (standalone so we can inline options)
# ---------------------------------------------------------------------------
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display        = ('quiz', 'order', 'question_text', 'question_type', 'points')
    list_filter         = ('quiz', 'question_type')
    search_fields       = ('question_text', 'quiz__title')
    raw_id_fields       = ('quiz',)
    list_select_related = ('quiz',)
    inlines             = [QuestionOptionInline]
    ordering            = ('quiz', 'order')
    list_per_page       = 100


# ---------------------------------------------------------------------------
# QuizAttempt
# ---------------------------------------------------------------------------
@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display        = ('user', 'quiz', 'attempt_number', 'status',
                           'score_percentage', 'passed', 'time_taken', 'started_at')
    list_filter         = ('status', 'passed', 'quiz')
    search_fields       = ('user__username', 'quiz__title')
    raw_id_fields       = ('user', 'quiz', 'kahoot_room')
    list_select_related = ('user', 'quiz')
    list_per_page       = 100

    inlines = [QuizAnswerInline]

    def has_add_permission(self, request):
        return False  # created programmatically


# ---------------------------------------------------------------------------
# KahootRoom
# ---------------------------------------------------------------------------
@admin.register(KahootRoom)
class KahootRoomAdmin(admin.ModelAdmin):
    list_display        = ('room_code', 'quiz', 'host', 'status',
                           'total_participants', 'created_at', 'started_at', 'ended_at')
    list_filter         = ('status',)
    search_fields       = ('room_code', 'quiz__title', 'host__username')
    raw_id_fields       = ('quiz', 'host')
    list_select_related = ('quiz', 'host')
    list_per_page       = 50


# ---------------------------------------------------------------------------
# KahootLeaderboard
# ---------------------------------------------------------------------------
@admin.register(KahootLeaderboard)
class KahootLeaderboardAdmin(admin.ModelAdmin):
    list_display        = ('room', 'user', 'rank', 'total_score', 'correct_answers')
    list_filter         = ('room',)
    raw_id_fields       = ('room', 'user')
    list_select_related = ('room', 'user')
    ordering            = ('room', 'rank')
    list_per_page       = 200