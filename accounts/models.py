"""
Accounts models - Custom User with role-based permissions
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'superuser')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
        
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with role-based system"""
    
    ROLE_CHOICES = [
        ('superuser', 'Superuser'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('guest', 'Guest'),
    ]
    
    # Basic Info
    username = models.CharField(max_length=150, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Role
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Profile
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')]
    )
    
    # Organization relationship (for teachers and students)
    school = models.ForeignKey(
        'organizations.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_teacher(self):
        return self.role == 'teacher'
    
    @property
    def is_student(self):
        return self.role == 'student'
    
    @property
    def is_guest_user(self):
        return self.role == 'guest'


class TeacherPermission(models.Model):
    """Granular permissions for teachers"""
    
    teacher = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},
        related_name='teacher_permissions'
    )
    
    # News/Blog permissions
    can_create_news = models.BooleanField(default=False)
    can_edit_news = models.BooleanField(default=False)
    can_delete_news = models.BooleanField(default=False)
    
    # Resource permissions
    can_upload_resources = models.BooleanField(default=False)
    can_edit_resources = models.BooleanField(default=False)
    can_delete_resources = models.BooleanField(default=False)
    
    # Quiz permissions
    can_create_quizzes = models.BooleanField(default=False)
    can_edit_quizzes = models.BooleanField(default=False)
    can_delete_quizzes = models.BooleanField(default=False)
    can_host_kahoot = models.BooleanField(default=False)
    
    # Student management permissions
    can_create_students = models.BooleanField(default=False)
    can_manage_classes = models.BooleanField(default=False)
    can_view_student_stats = models.BooleanField(default=False)
    
    # Category-specific permissions (stored as JSON or separate model)
    allowed_categories = models.JSONField(
        default=list,
        blank=True,
        help_text="List of category IDs this teacher can work with"
    )
    
    # Organization permissions
    can_create_schools = models.BooleanField(default=False)
    can_create_classes = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_permissions'
        verbose_name = 'Teacher Permission'
        verbose_name_plural = 'Teacher Permissions'
    
    def __str__(self):
        return f"Permissions for {self.teacher.username}"
    
    def has_permission(self, permission_name):
        """Check if teacher has specific permission"""
        return getattr(self, permission_name, False)
    
    def can_access_category(self, category_id):
        """Check if teacher can access specific category"""
        if not self.allowed_categories:
            return True  # If empty, allow all
        return category_id in self.allowed_categories


class StudentProfile(models.Model):
    """Extended profile for students"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='student_profile',
        db_column='user_id'
    )
    
    # Class assignment
    class_group = models.ForeignKey(
        'organizations.ClassGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    
    # Student ID
    student_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Parent/Guardian contact
    parent_name = models.CharField(max_length=200, blank=True)
    parent_phone = models.CharField(max_length=15, blank=True)
    parent_email = models.EmailField(blank=True)
    
    # Academic info
    date_of_birth = models.DateField(null=True, blank=True)
    enrollment_date = models.DateField(default=timezone.now)
    
    # Engagement metrics (cached for performance)
    total_quizzes_taken = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_profiles'
        ordering = ['user__username']
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['class_group']),
        ]
    
    def __str__(self):
        return f"Profile: {self.user.username}"
    
    def update_streak(self):
        """Update activity streak"""
        today = timezone.now().date()
        
        if self.last_activity_date == today:
            return  # Already updated today
        
        if self.last_activity_date == today - timezone.timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1
        
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        self.last_activity_date = today
        self.save(update_fields=['current_streak', 'longest_streak', 'last_activity_date'])


class ActivityLog(models.Model):
    """Track user activities for analytics"""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('quiz_start', 'Quiz Started'),
        ('quiz_complete', 'Quiz Completed'),
        ('resource_view', 'Resource Viewed'),
        ('resource_download', 'Resource Downloaded'),
        ('news_view', 'News Viewed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Additional context (JSON field for flexibility)
    metadata = models.JSONField(default=dict, blank=True)
    
    # IP and User Agent for security
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"