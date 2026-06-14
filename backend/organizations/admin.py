"""
Organizations – admin
"""

from django.contrib import admin
from .models import Region, School, ClassGroup, TeacherClassAssignment


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display  = ('name', 'code', 'is_active', 'total_schools', 'created_at')
    list_filter   = ('is_active',)
    search_fields = ('name', 'code')
    list_per_page = 50


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display        = ('name', 'school_number', 'region', 'is_active',
                           'total_classes', 'total_students', 'total_teachers')
    list_filter         = ('region', 'is_active')
    search_fields       = ('name', 'school_number', 'region__name')
    raw_id_fields       = ('created_by',)
    list_select_related = ('region',)
    list_per_page       = 50


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    list_display        = ('name', 'grade_level', 'section', 'school', 'academic_year',
                           'is_active', 'current_student_count', 'max_students')
    list_filter         = ('school', 'grade_level', 'academic_year', 'is_active')
    search_fields       = ('name', 'school__name', 'school__school_number')
    raw_id_fields       = ('class_teacher', 'created_by')
    filter_horizontal   = ('assigned_teachers',)
    list_select_related = ('school', 'school__region')
    list_per_page       = 50

    fieldsets = (
        ('Class Info', {'fields': ('name', 'grade_level', 'section', 'school', 'academic_year')}),
        ('Teachers',   {'fields': ('class_teacher', 'assigned_teachers')}),
        ('Settings',   {'fields': ('max_students', 'is_active')}),
    )


@admin.register(TeacherClassAssignment)
class TeacherClassAssignmentAdmin(admin.ModelAdmin):
    list_display        = ('teacher', 'class_group', 'subject', 'is_active',
                           'assigned_from', 'assigned_until')
    list_filter         = ('is_active', 'class_group__school')
    search_fields       = ('teacher__username', 'class_group__name', 'subject__name')
    raw_id_fields       = ('teacher', 'class_group', 'subject')
    list_select_related = ('teacher', 'class_group', 'subject')
    list_per_page       = 100