"""
Quizzes – serializers
"""

from rest_framework import serializers
from .models import (
    Quiz, Question, QuestionOption,
    QuizAttempt, QuizAnswer,
    KahootRoom, KahootLeaderboard,
)


# ---------------------------------------------------------------------------
# QuestionOption  (two variants: full for teachers, public for students)
# ---------------------------------------------------------------------------
class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QuestionOption
        fields = ['id', 'option_text', 'image', 'is_correct', 'order']
        read_only_fields = ['id']


class QuestionOptionPublicSerializer(serializers.ModelSerializer):
    """No is_correct field – shown to students during a quiz."""
    class Meta:
        model  = QuestionOption
        fields = ['id', 'option_text', 'image', 'order']


# ---------------------------------------------------------------------------
# Question  (two variants)
# ---------------------------------------------------------------------------
class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ['id', 'question_text', 'explanation', 'image',
                  'question_type', 'points', 'order', 'options']
        read_only_fields = ['id']


class QuestionPublicSerializer(serializers.ModelSerializer):
    """No explanation, no is_correct on options."""
    options = QuestionOptionPublicSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ['id', 'question_text', 'image', 'question_type', 'points', 'order', 'options']


# ---------------------------------------------------------------------------
# Quiz – list
# ---------------------------------------------------------------------------
class QuizListSerializer(serializers.ModelSerializer):
    category_name          = serializers.CharField(source='category.name', read_only=True)
    created_by_username    = serializers.SerializerMethodField()
    total_questions        = serializers.ReadOnlyField()
    total_points           = serializers.ReadOnlyField()

    class Meta:
        model  = Quiz
        fields = [
            'id', 'title', 'slug', 'description',
            'quiz_type', 'category', 'category_name', 'difficulty',
            'timing_mode', 'time_per_question', 'total_time',
            'passing_score',
            'total_questions', 'total_points',
            'is_published',
            'total_attempts', 'average_score',
            'created_by_username',
            'created_at', 'updated_at',
        ]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None


# ---------------------------------------------------------------------------
# Quiz – detail  (questions included; correctness depends on caller)
# ---------------------------------------------------------------------------
class QuizDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    questions     = serializers.SerializerMethodField()
    total_points  = serializers.ReadOnlyField()

    class Meta:
        model  = Quiz
        fields = [
            'id', 'title', 'slug', 'description',
            'quiz_type', 'category', 'category_name', 'difficulty',
            'timing_mode', 'time_per_question', 'total_time',
            'passing_score',
            'show_correct_answers', 'randomize_questions', 'randomize_options',
            'allow_review', 'max_attempts',
            'is_published',
            'total_attempts', 'average_score', 'total_points',
            'questions',
            'created_at', 'updated_at',
        ]

    def get_questions(self, obj):
        questions = obj.questions.all().order_by('order')
        user = self.context.get('request') and self.context['request'].user

        # Teachers (who created this quiz) and superusers see full data
        if user and (user.is_superuser or (user.is_teacher and obj.created_by == user)):
            return QuestionSerializer(questions, many=True).data

        # Everyone else gets the public version
        return QuestionPublicSerializer(questions, many=True).data


# ---------------------------------------------------------------------------
# Quiz – create / update  (nested questions + options)
# ---------------------------------------------------------------------------
class QuestionOptionWriteSerializer(serializers.Serializer):
    option_text = serializers.CharField()
    image       = serializers.ImageField(required=False, allow_null=True)
    is_correct  = serializers.BooleanField(default=False)
    order       = serializers.IntegerField(default=0)


class QuestionWriteSerializer(serializers.Serializer):
    question_text  = serializers.CharField()
    explanation    = serializers.CharField(required=False, default='')
    image          = serializers.ImageField(required=False, allow_null=True)
    question_type  = serializers.ChoiceField(choices=['single', 'multiple', 'true_false'], default='single')
    points         = serializers.IntegerField(default=1, min_value=1)
    order          = serializers.IntegerField(default=0)
    options        = QuestionOptionWriteSerializer(many=True)


class QuizWriteSerializer(serializers.ModelSerializer):
    questions = QuestionWriteSerializer(many=True, required=False)

    class Meta:
        model  = Quiz
        fields = [
            'title', 'description',
            'quiz_type', 'category', 'difficulty',
            'timing_mode', 'time_per_question', 'total_time',
            'passing_score',
            'show_correct_answers', 'randomize_questions', 'randomize_options',
            'allow_review', 'max_attempts',
            'is_published', 'thumbnail', 'tags',
            'questions',
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        _create_questions(quiz, questions_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If questions supplied, replace entirely
        if questions_data is not None:
            instance.questions.all().delete()
            _create_questions(instance, questions_data)

        return instance


def _create_questions(quiz, questions_data):
    for q_data in questions_data:
        options_data = q_data.pop('options', [])
        question = Question.objects.create(quiz=quiz, **q_data)
        for opt in options_data:
            QuestionOption.objects.create(question=question, **opt)


# ---------------------------------------------------------------------------
# QuizAttempt  (read-only; mutations via custom actions)
# ---------------------------------------------------------------------------
class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model  = QuizAttempt
        fields = [
            'id', 'attempt_id',
            'quiz', 'quiz_title',
            'user', 'attempt_number', 'status',
            'started_at', 'completed_at', 'time_taken',
            'score', 'max_score', 'score_percentage', 'passed',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# KahootRoom
# ---------------------------------------------------------------------------
class KahootRoomSerializer(serializers.ModelSerializer):
    quiz_title        = serializers.CharField(source='quiz.title', read_only=True)
    host_username     = serializers.CharField(source='host.username', read_only=True)
    total_participants = serializers.ReadOnlyField()

    class Meta:
        model  = KahootRoom
        fields = [
            'id', 'room_code',
            'quiz', 'quiz_title',
            'host', 'host_username',
            'status', 'max_players', 'allow_late_join',
            'total_participants',
            'created_at', 'started_at', 'ended_at',
        ]
        read_only_fields = [
            'id', 'room_code', 'host', 'status',
            'total_participants', 'created_at', 'started_at', 'ended_at',
        ]


class KahootRoomCreateSerializer(serializers.Serializer):
    quiz_id         = serializers.IntegerField()
    max_players     = serializers.IntegerField(default=50, min_value=2, max_value=500)
    allow_late_join = serializers.BooleanField(default=True)


# ---------------------------------------------------------------------------
# KahootLeaderboard entry
# ---------------------------------------------------------------------------
class KahootLeaderboardSerializer(serializers.ModelSerializer):
    username  = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model  = KahootLeaderboard
        fields = ['rank', 'user', 'username', 'full_name',
                  'total_score', 'correct_answers', 'average_time']