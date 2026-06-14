"""
News – views
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import NewsCategory, NewsPost, NewsComment, NewsAttachment
from .serializers import (
    NewsCategorySerializer,
    NewsPostListSerializer,
    NewsPostDetailSerializer,
    NewsPostWriteSerializer,
    NewsCommentSerializer,
    NewsAttachmentSerializer,
)
from accounts.permissions import CanCreateNews, IsSuperuser


# ---------------------------------------------------------------------------
# NewsCategory
# ---------------------------------------------------------------------------
class NewsCategoryViewSet(viewsets.ModelViewSet):
    queryset         = NewsCategory.objects.filter(is_active=True).order_by('order', 'name')
    serializer_class = NewsCategorySerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated(), IsSuperuser()]


# ---------------------------------------------------------------------------
# NewsPost
# ---------------------------------------------------------------------------
class NewsPostViewSet(viewsets.ModelViewSet):
    permission_classes = [CanCreateNews]

    filter_backends   = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields  = ['post_type', 'category', 'status', 'is_featured', 'is_pinned']
    search_fields     = ['title', 'excerpt', 'content', 'tags']
    ordering_fields   = ['published_at', 'created_at', 'view_count']
    ordering          = ['-is_pinned', '-published_at']

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated and (user.is_superuser or user.is_teacher):
            qs = NewsPost.objects.select_related('author', 'category').all()
            # Non-superuser teachers: own drafts + published
            if user.is_teacher and not user.is_superuser:
                from django.db.models import Q
                qs = qs.filter(Q(status='published') | Q(author=user))
            return qs

        # Students / guests / anonymous: published only
        return NewsPost.objects.select_related('author', 'category').filter(status='published')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return NewsPostWriteSerializer
        if self.action == 'retrieve':
            return NewsPostDetailSerializer
        return NewsPostListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# NewsComment
# ---------------------------------------------------------------------------
class NewsCommentViewSet(viewsets.ModelViewSet):
    serializer_class = NewsCommentSerializer

    def get_queryset(self):
        qs = NewsComment.objects.select_related('author', 'post').filter(is_approved=True)
        post_id = self.request.query_params.get('post')
        if post_id:
            qs = qs.filter(post_id=post_id)
            
        parent_only = self.request.query_params.get('parent_only')
        if parent_only == 'true':
            qs = qs.filter(parent__isnull=True)
            
        return qs

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        serializer.save(is_edited=True)

    def get_object(self):
        obj = super().get_object()
        if self.action in ('update', 'partial_update', 'destroy'):
            if obj.author != self.request.user and not self.request.user.is_superuser:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit or delete your own comments.")
        return obj


# ---------------------------------------------------------------------------
# NewsAttachment
# ---------------------------------------------------------------------------
class NewsAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = NewsAttachmentSerializer

    def get_queryset(self):
        qs = NewsAttachment.objects.select_related('post')
        post_id = self.request.query_params.get('post')
        if post_id:
            qs = qs.filter(post_id=post_id)
        return qs

    def get_permissions(self):
        if self.action == 'list':
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        post = serializer.validated_data.get('post')
        if post and post.author != self.request.user and not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add attachments to your own posts.")
        serializer.save()