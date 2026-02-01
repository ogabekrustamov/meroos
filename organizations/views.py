"""
Organizations – views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Region, School, ClassGroup, TeacherClassAssignment
from .serializers import (
    RegionSerializer,
    SchoolSerializer,
    ClassGroupSerializer,
    TeacherClassAssignmentSerializer,
)
from accounts.permissions import IsSuperuser, CanManageOrganization


# ---------------------------------------------------------------------------
# Region
# ---------------------------------------------------------------------------
class RegionViewSet(viewsets.ModelViewSet):
    queryset         = Region.objects.filter(is_active=True).order_by('name')
    serializer_class = RegionSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated(), IsSuperuser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ---------------------------------------------------------------------------
# School
# ---------------------------------------------------------------------------
class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer

    def get_queryset(self):
        qs = School.objects.select_related('region').filter(is_active=True)
        region_id = self.request.query_params.get('region')
        if region_id:
            qs = qs.filter(region_id=region_id)
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        if self.action == 'create':
            return [IsAuthenticated(), CanManageOrganization()]
        return [IsAuthenticated(), IsSuperuser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ---------------------------------------------------------------------------
# ClassGroup
# ---------------------------------------------------------------------------
class ClassGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ClassGroupSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = ClassGroup.objects.select_related('school', 'school__region').filter(is_active=True)

        school_id = self.request.query_params.get('school')
        if school_id:
            qs = qs.filter(school_id=school_id)

        # Teachers only see classes they belong to (unless superuser)
        if user.is_authenticated and user.is_teacher and not user.is_superuser:
            from django.db.models import Q
            assigned = TeacherClassAssignment.objects.filter(
                teacher=user, is_active=True
            ).values_list('class_group_id', flat=True)
            homeroom = ClassGroup.objects.filter(class_teacher=user).values_list('id', flat=True)
            qs = qs.filter(id__in=set(assigned) | set(homeroom))

        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        if self.action == 'create':
            return [IsAuthenticated(), CanManageOrganization()]
        return [IsAuthenticated(), IsSuperuser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # --- assign teacher ------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='assign-teacher')
    def assign_teacher(self, request, pk=None):
        if not request.user.is_superuser and not request.user.is_teacher:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        if request.user.is_teacher:
            try:
                if not request.user.teacher_permissions.can_manage_classes:
                    return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        class_group = self.get_object()
        teacher_id  = request.data.get('teacher_id')
        subject_id  = request.data.get('subject_id')   # optional

        if not teacher_id:
            return Response({"detail": "Provide teacher_id."}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.models import User
        try:
            teacher = User.objects.get(pk=teacher_id, role='teacher', is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "Teacher not found."}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = TeacherClassAssignment.objects.get_or_create(
            teacher=teacher,
            class_group=class_group,
            subject_id=subject_id,
            defaults={'is_active': True},
        )
        if not created and not assignment.is_active:
            assignment.is_active = True
            assignment.save(update_fields=['is_active'])

        class_group.assigned_teachers.add(teacher)

        return Response(
            TeacherClassAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    # --- remove teacher ------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='remove-teacher')
    def remove_teacher(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"detail": "Only superuser can remove teachers."}, status=status.HTTP_403_FORBIDDEN)

        class_group = self.get_object()
        teacher_id  = request.data.get('teacher_id')
        subject_id  = request.data.get('subject_id')

        if not teacher_id:
            return Response({"detail": "Provide teacher_id."}, status=status.HTTP_400_BAD_REQUEST)

        assignment = TeacherClassAssignment.objects.filter(
            teacher_id=teacher_id, class_group=class_group, subject_id=subject_id,
        ).first()

        if not assignment:
            return Response({"detail": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        assignment.is_active = False
        assignment.save(update_fields=['is_active'])

        # Remove from M2M only if no other active assignments remain
        if not TeacherClassAssignment.objects.filter(
            teacher_id=teacher_id, class_group=class_group, is_active=True
        ).exists():
            class_group.assigned_teachers.remove(teacher_id)

        return Response({"detail": "Teacher removed."})


# ---------------------------------------------------------------------------
# TeacherClassAssignment
# ---------------------------------------------------------------------------
class TeacherClassAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherClassAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = TeacherClassAssignment.objects.select_related(
            'teacher', 'class_group', 'subject'
        ).filter(is_active=True)

        if user.is_superuser:
            return qs
        if user.is_teacher:
            return qs.filter(teacher=user)
        return qs.none()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsSuperuser()]