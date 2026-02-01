"""
Organizations models - Regional structure (Region -> School -> Class)
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator


class Region(models.Model):
    """Geographic region (e.g., Tashkent, Samarkand)"""
    
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=10, unique=True, help_text="Short code for region")
    description = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='regions_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'regions'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def total_schools(self):
        return self.schools.filter(is_active=True).count()
    
    @property
    def total_students(self):
        from accounts.models import User
        return User.objects.filter(
            role='student',
            school__region=self,
            is_active=True
        ).count()


class School(models.Model):
    """School within a region"""
    
    name = models.CharField(max_length=300)
    school_number = models.CharField(max_length=50, help_text="e.g., 41")
    
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='schools'
    )
    
    # Contact information
    address = models.TextField(blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    
    # Principal/Director
    principal_name = models.CharField(max_length=200, blank=True)
    principal_phone = models.CharField(max_length=15, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='schools_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schools'
        ordering = ['region', 'school_number']
        unique_together = [['region', 'school_number']]
        indexes = [
            models.Index(fields=['region', 'school_number']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"School #{self.school_number} - {self.region.name}"
    
    @property
    def full_name(self):
        return f"{self.name} (School #{self.school_number})"
    
    @property
    def total_classes(self):
        return self.classes.filter(is_active=True).count()
    
    @property
    def total_students(self):
        from accounts.models import User
        return User.objects.filter(
            role='student',
            school=self,
            is_active=True
        ).count()
    
    @property
    def total_teachers(self):
        from accounts.models import User
        return User.objects.filter(
            role='teacher',
            school=self,
            is_active=True
        ).count()


class ClassGroup(models.Model):
    """Class/Grade within a school"""
    
    GRADE_CHOICES = [
        (1, '1st Grade'),
        (2, '2nd Grade'),
        (3, '3rd Grade'),
        (4, '4th Grade'),
        (5, '5th Grade'),
        (6, '6th Grade'),
        (7, '7th Grade'),
        (8, '8th Grade'),
        (9, '9th Grade'),
        (10, '10th Grade'),
        (11, '11th Grade'),
        (12, '12th Grade'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., 9-A, 11-B")
    grade_level = models.IntegerField(
        choices=GRADE_CHOICES,
        validators=[MinValueValidator(1)]
    )
    section = models.CharField(max_length=10, help_text="e.g., A, B, C")
    
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='classes'
    )
    
    # Academic year
    academic_year = models.CharField(
        max_length=20,
        help_text="e.g., 2024-2025"
    )
    
    # Class teacher (homeroom teacher)
    class_teacher = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'teacher'},
        related_name='homeroom_classes'
    )
    
    # Additional assigned teachers
    assigned_teachers = models.ManyToManyField(
        'accounts.User',
        limit_choices_to={'role': 'teacher'},
        related_name='assigned_classes',
        blank=True
    )
    
    # Capacity
    max_students = models.IntegerField(default=30)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='classes_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_groups'
        ordering = ['school', 'grade_level', 'section']
        unique_together = [['school', 'grade_level', 'section', 'academic_year']]
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        indexes = [
            models.Index(fields=['school', 'grade_level']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.school.full_name}"
    
    @property
    def current_student_count(self):
        return self.students.filter(user__is_active=True).count()
    
    @property
    def is_full(self):
        return self.current_student_count >= self.max_students
    
    @property
    def display_name(self):
        return f"Grade {self.grade_level}-{self.section}"
    
    def can_assign_teacher(self, teacher):
        """Check if teacher can be assigned to this class"""
        if not teacher.is_teacher:
            return False
        
        # Check if teacher has permission to manage classes
        try:
            perms = teacher.teacher_permissions
            return perms.can_manage_classes
        except:
            return False


class TeacherClassAssignment(models.Model):
    """Track teacher assignments to classes with subjects"""
    
    teacher = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},
        related_name='class_assignments'
    )
    
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='teacher_assignments'
    )
    
    # Subject they teach in this class
    subject = models.ForeignKey(
        'resources.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teacher_assignments'
    )
    
    # Schedule
    assigned_from = models.DateField(default=timezone.now)
    assigned_until = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_class_assignments'
        unique_together = [['teacher', 'class_group', 'subject']]
        ordering = ['class_group', 'subject']
        indexes = [
            models.Index(fields=['teacher', 'is_active']),
            models.Index(fields=['class_group', 'is_active']),
        ]
    
    def __str__(self):
        subject_name = self.subject.name if self.subject else "General"
        return f"{self.teacher.username} -> {self.class_group.name} ({subject_name})"