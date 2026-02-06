"""
Resources – views
"""

import os
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse

from .models import Category, Resource, ResourceCollection, ResourceBookmark, ResourceRating
from .serializers import (
    CategorySerializer,
    ResourceListSerializer,
    ResourceDetailSerializer,
    ResourceWriteSerializer,
    ResourceCollectionSerializer,
    ResourceBookmarkSerializer,
    ResourceRatingSerializer,
)
from accounts.permissions import CanManageResources, IsSuperuser


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        qs = Category.objects.filter(is_active=True).order_by('order', 'name')
        parent = self.request.query_params.get('parent')
        if parent == 'none':
            qs = qs.filter(parent=None)
        elif parent:
            qs = qs.filter(parent_id=parent)
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated(), IsSuperuser()]


# ---------------------------------------------------------------------------
# Resource
# ---------------------------------------------------------------------------
class ResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageResources]

    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resource_type', 'category', 'is_published', 'is_featured', 'access_level']
    search_fields    = ['title', 'description', 'tags', 'author_name']
    ordering_fields  = ['created_at', 'view_count', 'download_count']
    ordering         = ['-is_featured', '-created_at']

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and (user.is_superuser or user.is_teacher):
            qs = Resource.objects.select_related('category', 'uploaded_by')
            if user.is_teacher and not user.is_superuser:
                from django.db.models import Q
                qs = qs.filter(Q(is_published=True) | Q(uploaded_by=user))
            return qs

        return Resource.objects.select_related('category', 'uploaded_by').filter(is_published=True)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ResourceWriteSerializer
        if self.action == 'retrieve':
            return ResourceDetailSerializer
        return ResourceListSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    # --- increment view count ------------------------------------------------
    @action(detail=True, methods=['post'], url_path='view', permission_classes=[permissions.AllowAny])
    def view_resource(self, request, pk=None):
        resource = self.get_object()
        resource.increment_views()
        return Response({"view_count": resource.view_count})

    # --- download (streams file, increments counter) -------------------------
    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        resource = self.get_object()

        if not resource.allow_download:
            return Response(
                {"detail": "Downloads are disabled for this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Pick the right file field
        file_field = None
        if resource.resource_type == 'video' and resource.video_file:
            file_field = resource.video_file
        elif resource.file:
            file_field = resource.file

        if not file_field:
            return Response(
                {"detail": "No downloadable file for this resource."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resource.increment_downloads()

        response = FileResponse(
            file_field.open('rb'),
            content_type='application/octet-stream',
        )
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_field.name)}"'
        response['Content-Length']      = file_field.size
        return response


# ---------------------------------------------------------------------------
# ResourceCollection
# ---------------------------------------------------------------------------
class ResourceCollectionViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceCollectionSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = ResourceCollection.objects.all()

        if user.is_authenticated and user.is_superuser:
            return qs
        if user.is_authenticated and user.is_teacher:
            from django.db.models import Q
            return qs.filter(Q(is_public=True) | Q(created_by=user))
        return qs.filter(is_public=True)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ---------------------------------------------------------------------------
# ResourceBookmark  (user's own only)
# ---------------------------------------------------------------------------
class ResourceBookmarkViewSet(viewsets.ModelViewSet):
    serializer_class   = ResourceBookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ResourceBookmark.objects.filter(user=self.request.user).select_related('resource')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---------------------------------------------------------------------------
# ResourceRating  (one per user per resource; upsert on duplicate)
# ---------------------------------------------------------------------------
class ResourceRatingViewSet(viewsets.ModelViewSet):
    serializer_class   = ResourceRatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ResourceRating.objects.select_related('resource')
        resource_id = self.request.query_params.get('resource')
        if resource_id:
            qs = qs.filter(resource_id=resource_id)
        if not self.request.user.is_superuser:
            qs = qs.filter(user=self.request.user)
        return qs

    def perform_create(self, serializer):
        resource = serializer.validated_data['resource']
        existing = ResourceRating.objects.filter(user=self.request.user, resource=resource)
        if existing.exists():
            existing.update(
                rating=serializer.validated_data['rating'],
                review=serializer.validated_data.get('review', ''),
            )
        else:
            serializer.save(user=self.request.user)