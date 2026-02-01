"""
Custom permissions for role-based access control
"""

from rest_framework import permissions


class IsSuperuser(permissions.BasePermission):
    """Only allow superusers"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsTeacher(permissions.BasePermission):
    """Only allow teachers"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_teacher


class IsStudent(permissions.BasePermission):
    """Only allow students"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_student


class IsTeacherOrReadOnly(permissions.BasePermission):
    """Allow teachers to edit, others to read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_teacher


class CanCreateNews(permissions.BasePermission):
    """Check if teacher has permission to create news"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            
            if view.action == 'create':
                return perms.can_create_news
            elif view.action in ['update', 'partial_update']:
                return perms.can_edit_news
            elif view.action == 'destroy':
                return perms.can_delete_news
            
            return True  # Allow read operations
        except:
            return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
        
        # Teachers can only edit their own posts
        if request.user.is_teacher:
            return obj.author == request.user
        
        return False


class CanManageResources(permissions.BasePermission):
    """Check if teacher has permission to manage resources"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            # Allow public read access
            if request.method in permissions.SAFE_METHODS:
                return True
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            # Students can read
            if request.method in permissions.SAFE_METHODS:
                return True
            return False
        
        try:
            perms = request.user.teacher_permissions
            
            if view.action == 'create':
                return perms.can_upload_resources
            elif view.action in ['update', 'partial_update']:
                return perms.can_edit_resources
            elif view.action == 'destroy':
                return perms.can_delete_resources
            
            return True
        except:
            return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
        
        if request.user.is_teacher:
            return obj.uploaded_by == request.user
        
        return False


class CanManageQuizzes(permissions.BasePermission):
    """Check if teacher has permission to manage quizzes"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            # Allow public read for published quizzes
            if request.method in permissions.SAFE_METHODS:
                return True
            return False
        
        if request.user.is_superuser:
            return True
        
        # Students can take quizzes
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            
            if view.action == 'create':
                return perms.can_create_quizzes
            elif view.action in ['update', 'partial_update']:
                return perms.can_edit_quizzes
            elif view.action == 'destroy':
                return perms.can_delete_quizzes
            
            return True
        except:
            return False
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            # Check if quiz is published or user is creator
            if obj.is_published:
                return True
            return obj.created_by == request.user
        
        if request.user.is_superuser:
            return True
        
        if request.user.is_teacher:
            # Check category permission
            try:
                perms = request.user.teacher_permissions
                if not perms.can_access_category(obj.category_id):
                    return False
            except:
                pass
            
            return obj.created_by == request.user
        
        return False


class CanHostKahoot(permissions.BasePermission):
    """Check if user can host Kahoot-style quizzes"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            return perms.can_host_kahoot
        except:
            return False


class CanManageStudents(permissions.BasePermission):
    """Check if teacher can manage students"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            return perms.can_create_students
        except:
            return False


class CanViewStudentStats(permissions.BasePermission):
    """Check if teacher can view student statistics"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Students can view their own stats
        if request.user.is_student:
            # This will be further checked in has_object_permission
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            return perms.can_view_student_stats
        except:
            return False
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        # Students can only view their own stats
        if request.user.is_student:
            return obj.user == request.user
        
        if request.user.is_teacher:
            # Check if teacher is assigned to student's class
            try:
                student_profile = obj.user.student_profile
                if not student_profile.class_group:
                    return False
                
                # Check if teacher is assigned to this class
                from organizations.models import TeacherClassAssignment
                is_assigned = TeacherClassAssignment.objects.filter(
                    teacher=request.user,
                    class_group=student_profile.class_group,
                    is_active=True
                ).exists()
                
                return is_assigned
            except:
                return False
        
        return False


class CanManageOrganization(permissions.BasePermission):
    """Check if user can manage organizational structure"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            return False
        
        try:
            perms = request.user.teacher_permissions
            
            # Check specific permissions based on view action
            if view.basename == 'school':
                return perms.can_create_schools
            elif view.basename == 'class':
                return perms.can_create_classes
            
            return perms.can_manage_classes
        except:
            return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission to only allow owners to edit"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if object has owner/creator field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'author'):
            return obj.author == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        
        return False


class CanAccessCategory(permissions.BasePermission):
    """Check if teacher has access to specific category"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            # Allow public read access
            if request.method in permissions.SAFE_METHODS:
                return True
            return False
        
        if request.user.is_superuser:
            return True
        
        # Students have access to all categories
        if request.user.is_student or request.method in permissions.SAFE_METHODS:
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.is_superuser:
            return True
        
        if not request.user.is_teacher:
            return False
        
        # Get category from object
        category_id = None
        if hasattr(obj, 'category'):
            category_id = obj.category_id
        elif hasattr(obj, 'id'):
            category_id = obj.id
        
        if category_id is None:
            return False
        
        try:
            perms = request.user.teacher_permissions
            return perms.can_access_category(category_id)
        except:
            return False