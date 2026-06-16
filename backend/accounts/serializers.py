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


# ---------------------------------------------------------------------------
# Admin user management  –  superuser-only CRUD over all accounts
# ---------------------------------------------------------------------------
class AdminUserSerializer(serializers.ModelSerializer):
    full_name   = serializers.ReadOnlyField()
    school_name = serializers.CharField(source='school.name', read_only=True)
    password    = serializers.CharField(
        write_only=True, required=False, min_length=6, allow_blank=True
    )

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'phone_number', 'school', 'school_name',
            'password', 'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'full_name', 'school_name', 'date_joined', 'last_login']

    def validate_username(self, value):
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        # Run Django's password validators here so a weak password is reported
        # as a 400 (DRF converts Django's ValidationError raised in field
        # validation) instead of bubbling up as a 500.
        if value:
            validate_password(value)
        return value

    def _apply_role_flags(self, user, role):
        """Keep is_superuser / is_staff consistent with the chosen role."""
        is_admin = role == 'superuser'
        user.is_superuser = is_admin
        user.is_staff = is_admin

    def _ensure_related(self, user):
        """Auto-create the profile/permission row a role depends on."""
        if user.role == 'student':
            StudentProfile.objects.get_or_create(user=user)
        elif user.role == 'teacher':
            TeacherPermission.objects.get_or_create(teacher=user)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})

        user = User(**validated_data)
        user.set_password(password)
        self._apply_role_flags(user, user.role)
        user.save()
        self._ensure_related(user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        self._apply_role_flags(instance, instance.role)
        if password:
            instance.set_password(password)
        instance.save()
        self._ensure_related(instance)
        return instance