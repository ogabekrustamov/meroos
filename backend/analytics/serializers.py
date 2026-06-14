"""
Analytics – serializers
"""

from rest_framework import serializers
from .models import (
    UserStatistics, CategoryStatistics,
    ClassStatistics, QuizStatistics,
    DailyActivity, Leaderboard,
)


class UserStatisticsSerializer(serializers.ModelSerializer):
    username  = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model  = UserStatistics
        fields = [
            'username', 'full_name',
            'total_quizzes_attempted', 'total_quizzes_completed', 'total_quizzes_passed',
            'average_score_percentage', 'highest_score_percentage',
            'total_points_earned',
            'total_time_spent', 'average_quiz_time',
            'current_streak_days', 'longest_streak_days', 'last_activity_date',
            'global_rank', 'class_rank', 'school_rank',
            'total_resources_viewed', 'total_resources_downloaded',
            'last_updated',
        ]
        read_only_fields = fields


class CategoryStatisticsSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = CategoryStatistics
        fields = [
            'category', 'category_name',
            'quizzes_attempted', 'quizzes_completed', 'quizzes_passed',
            'average_score', 'highest_score',
            'total_time_spent', 'resources_viewed',
            'last_activity',
        ]
        read_only_fields = fields


class ClassStatisticsSerializer(serializers.ModelSerializer):
    class_name            = serializers.SerializerMethodField()
    top_student_username  = serializers.SerializerMethodField()

    class Meta:
        model  = ClassStatistics
        fields = [
            'class_group', 'class_name',
            'total_students', 'active_students',
            'total_quizzes_attempted', 'total_quizzes_completed',
            'average_class_score', 'average_streak',
            'top_student', 'top_student_username', 'top_student_score',
            'last_updated',
        ]
        read_only_fields = fields

    def get_class_name(self, obj):
        return obj.class_group.name if obj.class_group else None

    def get_top_student_username(self, obj):
        return obj.top_student.username if obj.top_student else None


class QuizStatisticsSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model  = QuizStatistics
        fields = [
            'quiz', 'quiz_title',
            'total_attempts', 'total_completions', 'completion_rate',
            'average_score', 'median_score', 'highest_score', 'lowest_score',
            'pass_rate', 'total_passed',
            'average_time', 'fastest_time', 'slowest_time',
            'easiest_question', 'hardest_question',
            'last_updated',
        ]
        read_only_fields = fields


class DailyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = DailyActivity
        fields = [
            'date',
            'total_users', 'active_users', 'new_users',
            'quizzes_attempted', 'quizzes_completed', 'average_score',
            'resources_viewed', 'resources_downloaded',
            'kahoot_rooms_created', 'kahoot_participants',
        ]
        read_only_fields = fields


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    total_points = serializers.IntegerField(source='total_points_earned')
    average_score = serializers.FloatField(source='average_score_percentage')
    quizzes_completed = serializers.IntegerField(source='total_quizzes_completed')

    class Meta:
        model = UserStatistics
        fields = ['user', 'total_points', 'average_score', 'quizzes_completed']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.full_name
        }
