"""
Analytics – admin
"""

from django.contrib import admin
from .models import (
    UserStatistics,
    CategoryStatistics,
    ClassStatistics,
    QuizStatistics,
    DailyActivity,
    Leaderboard,
)


# ---------------------------------------------------------------------------
# UserStatistics  (read-only — refreshed programmatically)
# ---------------------------------------------------------------------------
@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    list_display        = (
        'user', 'total_quizzes_completed', 'average_score_percentage',
        'highest_score_percentage', 'total_points_earned',
        'current_streak_days', 'global_rank', 'last_updated',
    )
    list_filter         = ('global_rank',)
    search_fields       = ('user__username', 'user__first_name', 'user__last_name')
    raw_id_fields       = ('user',)
    list_select_related = ('user',)
    list_per_page       = 100
    ordering            = ('-total_points_earned',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# CategoryStatistics  (read-only)
# ---------------------------------------------------------------------------
@admin.register(CategoryStatistics)
class CategoryStatisticsAdmin(admin.ModelAdmin):
    list_display        = ('user', 'category', 'quizzes_completed', 'average_score', 'highest_score')
    list_filter         = ('category',)
    search_fields       = ('user__username', 'category__name')
    raw_id_fields       = ('user', 'category')
    list_select_related = ('user', 'category')
    list_per_page       = 200
    ordering            = ('-average_score',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# ClassStatistics  (read-only)
# ---------------------------------------------------------------------------
@admin.register(ClassStatistics)
class ClassStatisticsAdmin(admin.ModelAdmin):
    list_display        = (
        'class_group', 'total_students', 'active_students',
        'average_class_score', 'top_student', 'top_student_score',
    )
    search_fields       = ('class_group__name', 'class_group__school__name')
    raw_id_fields       = ('class_group', 'top_student')
    list_select_related = ('class_group', 'class_group__school', 'top_student')
    list_per_page       = 100

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# QuizStatistics  (read-only)
# ---------------------------------------------------------------------------
@admin.register(QuizStatistics)
class QuizStatisticsAdmin(admin.ModelAdmin):
    list_display        = (
        'quiz', 'total_attempts', 'total_completions', 'completion_rate',
        'average_score', 'pass_rate', 'average_time',
    )
    search_fields       = ('quiz__title',)
    raw_id_fields       = ('quiz', 'easiest_question', 'hardest_question')
    list_select_related = ('quiz',)
    list_per_page       = 100

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# DailyActivity  (read-only)
# ---------------------------------------------------------------------------
@admin.register(DailyActivity)
class DailyActivityAdmin(admin.ModelAdmin):
    list_display  = (
        'date', 'total_users', 'active_users', 'new_users',
        'quizzes_attempted', 'quizzes_completed',
        'resources_viewed', 'kahoot_rooms_created',
    )
    ordering      = ('-date',)
    list_per_page = 365

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# Leaderboard  (cached snapshots — read-only)
# ---------------------------------------------------------------------------
@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display  = ('leaderboard_type', 'category', 'class_group', 'school',
                     'period_start', 'period_end', 'last_updated')
    list_filter   = ('leaderboard_type',)
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False