"""
Accounts – serializers
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, TeacherPermission, StudentProfile, ActivityLog


# ---------------------------------------------------------------------------
# Snippet – lightweight, used inside other apps' serializers
# ---------------------------------------------------------------------------
class UserSnippetSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'full_name', 'avatar', 'role']


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class RegisterSerializer(serializers.Serializer):
    username   = serializers.CharField(max_length=150)
    password   = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name  = serializers.CharField(max_length=150, required=False, default='')
    email      = serializers.EmailField(required=False, allow_null=True, default=None)
    role       = serializers.ChoiceField(
        choices=['teacher', 'student'], required=False, default='student'
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


# ---------------------------------------------------------------------------
# Profile  (GET /auth/me)
# ---------------------------------------------------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'avatar', 'phone_number',
            'school', 'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'username', 'role', 'date_joined', 'last_login', 'school']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'avatar', 'phone_number']


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({"old_password": "Incorrect password."})
        return attrs

    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance


# ---------------------------------------------------------------------------
# Teacher permissions
# ---------------------------------------------------------------------------
class TeacherPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TeacherPermission
        fields = [
            'id',
            'can_create_news', 'can_edit_news', 'can_delete_news',
            'can_upload_resources', 'can_edit_resources', 'can_delete_resources',
            'can_create_quizzes', 'can_edit_quizzes', 'can_delete_quizzes', 'can_host_kahoot',
            'can_create_students', 'can_manage_classes', 'can_view_student_stats',
            'allowed_categories',
            'can_create_schools', 'can_create_classes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Student profile
# ---------------------------------------------------------------------------
class StudentProfileSerializer(serializers.ModelSerializer):
    student          = UserSnippetSerializer(read_only=True, source='user')
    class_group_name = serializers.SerializerMethodField()

    class Meta:
        model  = StudentProfile
        fields = [
            'id', 'student', 'class_group', 'class_group_name', 'student_id',
            'parent_name', 'parent_phone', 'parent_email',
            'date_of_birth', 'enrollment_date',
            'total_quizzes_taken', 'average_score',
            'current_streak', 'longest_streak', 'last_activity_date',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'created_at', 'updated_at',
            'total_quizzes_taken', 'average_score',
            'current_streak', 'longest_streak', 'last_activity_date',
        ]

    def get_class_group_name(self, obj):
        return obj.class_group.name if obj.class_group else None


# ---------------------------------------------------------------------------
# Activity log  (read-only)
# ---------------------------------------------------------------------------
class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ActivityLog
        fields = ['id', 'action', 'timestamp', 'metadata']
        read_only_fields = fields