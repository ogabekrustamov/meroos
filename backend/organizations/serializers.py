"""
Organizations – serializers
"""

from rest_framework import serializers
from .models import Region, School, ClassGroup, TeacherClassAssignment


class RegionSerializer(serializers.ModelSerializer):
    total_schools  = serializers.ReadOnlyField()
    total_students = serializers.ReadOnlyField()

    class Meta:
        model  = Region
        fields = ['id', 'name', 'code', 'description', 'is_active',
                  'total_schools', 'total_students', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolSerializer(serializers.ModelSerializer):
    region_name    = serializers.CharField(source='region.name', read_only=True)
    total_classes  = serializers.ReadOnlyField()
    total_students = serializers.ReadOnlyField()
    total_teachers = serializers.ReadOnlyField()

    class Meta:
        model  = School
        fields = [
            'id', 'name', 'school_number', 'region', 'region_name',
            'address', 'phone_number', 'email',
            'principal_name', 'principal_phone', 'is_active',
            'total_classes', 'total_students', 'total_teachers',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClassGroupSerializer(serializers.ModelSerializer):
    school_name          = serializers.CharField(source='school.full_name', read_only=True)
    current_student_count = serializers.ReadOnlyField()
    is_full              = serializers.ReadOnlyField()
    display_name         = serializers.ReadOnlyField()

    class Meta:
        model  = ClassGroup
        fields = [
            'id', 'name', 'grade_level', 'section',
            'school', 'school_name', 'academic_year',
            'class_teacher', 'assigned_teachers',
            'max_students', 'is_active',
            'current_student_count', 'is_full', 'display_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherClassAssignmentSerializer(serializers.ModelSerializer):
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    class_name       = serializers.CharField(source='class_group.name', read_only=True)
    subject_name     = serializers.SerializerMethodField()

    class Meta:
        model  = TeacherClassAssignment
        fields = [
            'id', 'teacher', 'teacher_username',
            'class_group', 'class_name',
            'subject', 'subject_name',
            'assigned_from', 'assigned_until', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None