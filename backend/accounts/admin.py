"""
Accounts – admin
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TeacherPermission, StudentProfile, ActivityLog


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering       = ('-date_joined',)
    list_display   = ('username', 'email', 'full_name', 'role', 'is_active', 'date_joined')
    list_filter    = ('role', 'is_active', 'is_staff')
    search_fields  = ('username', 'email', 'first_name', 'last_name')
    list_per_page  = 50

    fieldsets = (
        (None,            {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'avatar')}),
        ('Role & Org',    {'fields': ('role', 'school')}),
        ('Permissions',   {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps',    {'fields': ('date_joined', 'last_login')}),
    )

    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('username', 'password1', 'password2', 'role')}),
    )

    readonly_fields = ('date_joined', 'last_login')


# ---------------------------------------------------------------------------
# TeacherPermission
# ---------------------------------------------------------------------------
@admin.register(TeacherPermission)
class TeacherPermissionAdmin(admin.ModelAdmin):
    list_display  = ('teacher', 'can_create_news', 'can_upload_resources',
                     'can_create_quizzes', 'can_host_kahoot', 'can_create_students')
    list_filter   = ('can_create_news', 'can_upload_resources', 'can_create_quizzes')
    search_fields = ('teacher__username',)
    raw_id_fields = ('teacher',)

    fieldsets = (
        ('Teacher',         {'fields': ('teacher',)}),
        ('News',            {'fields': ('can_create_news', 'can_edit_news', 'can_delete_news')}),
        ('Resources',       {'fields': ('can_upload_resources', 'can_edit_resources', 'can_delete_resources')}),
        ('Quizzes',         {'fields': ('can_create_quizzes', 'can_edit_quizzes', 'can_delete_quizzes', 'can_host_kahoot')}),
        ('Students/Classes',{'fields': ('can_create_students', 'can_manage_classes', 'can_view_student_stats')}),
        ('Organization',    {'fields': ('can_create_schools', 'can_create_classes')}),
        ('Categories',      {'fields': ('allowed_categories',)}),
    )


# ---------------------------------------------------------------------------
# StudentProfile
# ---------------------------------------------------------------------------
@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display        = ('user', 'student_id', 'class_group', 'current_streak', 'average_score')
    list_filter         = ('class_group',)
    search_fields       = ('user__username', 'student_id', 'user__first_name', 'user__last_name')
    raw_id_fields       = ('user',)
    list_select_related = ('user', 'class_group')
    list_per_page       = 50


# ---------------------------------------------------------------------------
# ActivityLog  (read-only)
# ---------------------------------------------------------------------------
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display        = ('user', 'action', 'timestamp', 'ip_address')
    list_filter         = ('action',)
    search_fields       = ('user__username',)
    raw_id_fields       = ('user',)
    list_select_related = ('user',)
    list_per_page       = 100

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False