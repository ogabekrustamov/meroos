"""
News – serializers
"""

from rest_framework import serializers
from .models import NewsCategory, NewsPost, NewsComment, NewsAttachment


class NewsCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model  = NewsCategory
        fields = ['id', 'name', 'slug', 'description', 'order', 'is_active', 'post_count']
        read_only_fields = ['id', 'slug']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


# ---------------------------------------------------------------------------
# Attachment
# ---------------------------------------------------------------------------
class NewsAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NewsAttachment
        fields = ['id', 'post', 'file', 'filename', 'description', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'filename', 'file_size', 'uploaded_at']


# ---------------------------------------------------------------------------
# Comment  (with one level of nested replies)
# ---------------------------------------------------------------------------
class NewsCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.CharField(source='author.full_name', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model  = NewsComment
        fields = [
            'id', 'post', 'author', 'author_username', 'author_full_name',
            'content', 'parent',
            'is_approved', 'is_edited',
            'created_at', 'updated_at', 'replies',
        ]
        read_only_fields = ['id', 'author', 'is_approved', 'is_edited', 'created_at', 'updated_at']

    def get_replies(self, obj):
        children = obj.replies.filter(is_approved=True).order_by('created_at')[:50]
        return NewsCommentSerializer(children, many=True).data


# ---------------------------------------------------------------------------
# NewsPost – list (no full content)
# ---------------------------------------------------------------------------
class NewsPostListSerializer(serializers.ModelSerializer):
    category         = NewsCategorySerializer(read_only=True)
    author_username  = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.CharField(source='author.full_name', read_only=True)
    comment_count    = serializers.SerializerMethodField()

    class Meta:
        model  = NewsPost
        fields = [
            'id', 'title', 'slug', 'excerpt',
            'featured_image', 'post_type', 'category', 'tags',
            'author', 'author_username', 'author_full_name',
            'status', 'published_at',
            'is_featured', 'is_pinned',
            'view_count', 'comment_count',
            'created_at', 'updated_at',
        ]

    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


# ---------------------------------------------------------------------------
# NewsPost – detail (full content + comments + attachments)
# ---------------------------------------------------------------------------
class NewsPostDetailSerializer(serializers.ModelSerializer):
    category         = NewsCategorySerializer(read_only=True)
    author_username  = serializers.CharField(source='author.username', read_only=True)
    author_full_name = serializers.CharField(source='author.full_name', read_only=True)
    comments         = serializers.SerializerMethodField()
    attachments      = NewsAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model  = NewsPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'featured_image', 'post_type', 'category', 'tags',
            'author', 'author_username', 'author_full_name',
            'status', 'published_at',
            'is_featured', 'is_pinned', 'view_count',
            'meta_description', 'meta_keywords',
            'comments', 'attachments',
            'created_at', 'updated_at',
        ]

    def get_comments(self, obj):
        top = obj.comments.filter(parent=None, is_approved=True).order_by('-created_at')[:100]
        return NewsCommentSerializer(top, many=True).data


# ---------------------------------------------------------------------------
# NewsPost – create / update
# ---------------------------------------------------------------------------
class NewsPostWriteSerializer(serializers.ModelSerializer):
    # Explicitly handle boolean fields (FormData sends "true"/"false" strings)
    is_featured = serializers.BooleanField(required=False, default=False)
    is_pinned = serializers.BooleanField(required=False, default=False)
    
    # Make optional fields explicit
    excerpt = serializers.CharField(required=False, allow_blank=True, default='')
    category = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(),
        required=False,
        allow_null=True
    )
    status = serializers.CharField(required=False, default='published')
    
    class Meta:
        model  = NewsPost
        fields = [
            'title', 'excerpt', 'content',
            'featured_image', 'post_type', 'category', 'tags',
            'status', 'is_featured', 'is_pinned',
            'meta_description', 'meta_keywords',
        ]