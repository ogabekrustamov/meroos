"""
Accounts – views
"""

from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, TeacherPermission, StudentProfile, ActivityLog
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    TeacherPermissionSerializer,
    StudentProfileSerializer,
    UserSnippetSerializer,
)
from .permissions import IsSuperuser


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _log(request, user, action, metadata=None):
    ActivityLog.objects.create(
        user=user,
        action=action,
        metadata=metadata or {},
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
    )


# ---------------------------------------------------------------------------
# Auth  –  all endpoints live under /api/auth/
# ---------------------------------------------------------------------------
class AuthViewSet(viewsets.ViewSet):
    """
    login            POST /api/auth/login/
    register         POST /api/auth/register/
    me               GET  /api/auth/me/
    me               PATCH /api/auth/me/
    change-password  POST /api/auth/change-password/
    logout           POST /api/auth/logout/
    permissions      GET  /api/auth/permissions/
    permissions      PUT  /api/auth/permissions/
    """

    def get_permissions(self):
        if self.action in ('login', 'register'):
            return [AllowAny()]
        return [IsAuthenticated()]

    # --- login ---------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request=request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid username or password, or account is inactive."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        _log(request, user, 'login')

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSnippetSerializer(user, context={'request': request}).data,
        })

    # --- register ------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        role_requested = request.data.get('role', 'student')

        # Enforce who may create whom
        if role_requested == 'teacher' and not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can create teacher accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if role_requested == 'student' and not request.user.is_superuser:
            try:
                if not request.user.teacher_permissions.can_create_students:
                    raise TeacherPermission.DoesNotExist
            except TeacherPermission.DoesNotExist:
                return Response(
                    {"detail": "You do not have permission to create students."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto-create StudentProfile for new students
        if user.role == 'student':
            StudentProfile.objects.get_or_create(user=user)

        # Auto-create TeacherPermission for new teachers
        if user.role == 'teacher':
            TeacherPermission.objects.get_or_create(teacher=user)

        return Response(UserSnippetSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)

    # --- me ------------------------------------------------------------------
    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            return Response(ProfileSerializer(request.user, context={'request': request}).data)

        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileSerializer(request.user, context={'request': request}).data)

    # --- change password -----------------------------------------------------
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        serializer = ChangePasswordSerializer(
            instance=request.user,
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        return Response({"detail": "Password changed successfully."})

    # --- logout --------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        refresh = request.data.get('refresh')
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        _log(request, request.user, 'logout')
        return Response({"detail": "Logged out successfully."})

    # --- teacher permissions (GET / PUT / PATCH) -----------------------------
    @action(detail=False, methods=['get', 'put', 'patch'], url_path='permissions')
    def permissions(self, request):
        # --- GET -------------------------------------------------------------
        if request.method == 'GET':
            teacher_id = request.query_params.get('teacher_id')

            if request.user.is_superuser and teacher_id:
                try:
                    perm = TeacherPermission.objects.get(teacher_id=teacher_id)
                except TeacherPermission.DoesNotExist:
                    return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            elif request.user.is_teacher:
                try:
                    perm = request.user.teacher_permissions
                except TeacherPermission.DoesNotExist:
                    return Response({"detail": "No permission record."}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

            return Response(TeacherPermissionSerializer(perm).data)

        # --- PUT / PATCH -----------------------------------------------------
        if not request.user.is_superuser:
            return Response(
                {"detail": "Only superusers can update teacher permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        teacher_id = request.data.get('teacher_id') or request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({"detail": "Provide teacher_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            perm = TeacherPermission.objects.get(teacher_id=teacher_id)
        except TeacherPermission.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TeacherPermissionSerializer(perm, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Student profiles  –  /api/auth/students/
# ---------------------------------------------------------------------------
class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return StudentProfile.objects.select_related('user', 'class_group').all()

        if user.is_teacher:
            from organizations.models import TeacherClassAssignment
            class_ids = TeacherClassAssignment.objects.filter(
                teacher=user, is_active=True
            ).values_list('class_group_id', flat=True)
            return StudentProfile.objects.filter(
                class_group_id__in=class_ids
            ).select_related('user', 'class_group')

        if user.is_student:
            return StudentProfile.objects.filter(user=user).select_related('user', 'class_group')

        return StudentProfile.objects.none()

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'assign_class', 'teachers'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsSuperuser()]

    # --- assign student to a class -------------------------------------------
    @action(detail=True, methods=['post'], url_path='assign-class')
    def assign_class(self, request, pk=None):
        if not request.user.is_superuser and not request.user.is_teacher:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        profile       = self.get_object()
        class_group_id = request.data.get('class_group')
        if not class_group_id:
            return Response({"detail": "Provide class_group id."}, status=status.HTTP_400_BAD_REQUEST)

        from organizations.models import ClassGroup
        try:
            cg = ClassGroup.objects.get(pk=class_group_id, is_active=True)
        except ClassGroup.DoesNotExist:
            return Response({"detail": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        if cg.is_full:
            return Response({"detail": "Class is full."}, status=status.HTTP_400_BAD_REQUEST)

        profile.class_group = cg
        profile.save(update_fields=['class_group'])
        return Response(StudentProfileSerializer(profile).data)

    # --- all teachers --------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='teachers')
    def teachers(self, request):
        """Get all active teachers"""
        teachers = User.objects.filter(role='teacher', is_active=True)

        data = []
        for teacher in teachers:
            # Initials
            if teacher.first_name and teacher.last_name:
                initials = f"{teacher.first_name[0]}{teacher.last_name[0]}".upper()
            else:
                initials = teacher.username[:2].upper()

            # Teacher subject 
            # (Note: A teacher can have multiple assignments/subjects. 
            # For now, we'll try to get their primary subject from their assignments if possible, 
            # or just generic "Teacher")
            subject_name = "Teacher"
            
            # Simple heuristic: take the most frequent subject from their active assignments
            # or just the first one found.
            from organizations.models import TeacherClassAssignment
            first_assignment = TeacherClassAssignment.objects.filter(
                teacher=teacher, 
                is_active=True,
                subject__isnull=False
            ).first()
            
            if first_assignment and first_assignment.subject:
                subject_name = first_assignment.subject.name

            data.append({
                "id": teacher.id,
                "name": teacher.full_name,
                "subject": subject_name,
                "initials": initials,
                "avatar": teacher.avatar.url if teacher.avatar else None,
            })
        
        return Response(data)