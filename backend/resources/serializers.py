"""
Resources – serializers
"""

from rest_framework import serializers
from .models import Category, Resource, ResourceCollection, ResourceBookmark, ResourceRating


# ---------------------------------------------------------------------------
# Category  (recursive subcategories)
# ---------------------------------------------------------------------------
class CategorySerializer(serializers.ModelSerializer):
    parent_name     = serializers.SerializerMethodField()
    total_resources = serializers.ReadOnlyField()
    subcategories   = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = [
            'id', 'name', 'slug', 'description',
            'icon', 'color',
            'parent', 'parent_name',
            'order', 'is_active',
            'total_resources', 'subcategories',
        ]
        read_only_fields = ['id', 'slug']

    def get_parent_name(self, obj):
        return obj.parent.name if obj.parent else None

    def get_subcategories(self, obj):
        return CategorySerializer(
            obj.subcategories.filter(is_active=True), many=True
        ).data


# ---------------------------------------------------------------------------
# Resource – list  (lightweight, no heavy content/file fields)
# ---------------------------------------------------------------------------
class ResourceListSerializer(serializers.ModelSerializer):
    category_name          = serializers.CharField(source='category.name', read_only=True)
    uploaded_by_username   = serializers.SerializerMethodField()
    file_size_mb           = serializers.ReadOnlyField()

    class Meta:
        model  = Resource
        fields = [
            'id', 'title', 'slug', 'description',
            'resource_type', 'category', 'category_name',
            'video_url', 'video_duration',
            'external_url', 'thumbnail',
            'uploaded_by_username',
            'allow_download', 'is_published', 'is_featured',
            'view_count', 'download_count', 'file_size_mb',
            'created_at', 'updated_at',
        ]

    def get_uploaded_by_username(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else None


# ---------------------------------------------------------------------------
# Resource – detail
# ---------------------------------------------------------------------------
class ResourceDetailSerializer(serializers.ModelSerializer):
    category             = CategorySerializer(read_only=True)
    uploaded_by_username = serializers.SerializerMethodField()
    file_size_mb         = serializers.ReadOnlyField()
    average_rating       = serializers.SerializerMethodField()

    class Meta:
        model  = Resource
        fields = [
            'id', 'title', 'slug', 'description',
            'resource_type', 'category',
            'video_file', 'video_url', 'video_duration',
            'file', 'content', 'external_url', 'thumbnail',
            'author_name', 'source', 'tags',
            'access_level', 'allow_download',
            'is_published', 'is_featured',
            'uploaded_by_username',
            'view_count', 'download_count', 'file_size_mb',
            'average_rating',
            'created_at', 'updated_at',
        ]

    def get_uploaded_by_username(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else None

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if not ratings:
            return None
        return round(sum(r.rating for r in ratings) / len(ratings), 1)


# ---------------------------------------------------------------------------
# Resource – create / update
# ---------------------------------------------------------------------------
class ResourceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Resource
        fields = [
            'title', 'description',
            'resource_type', 'category',
            'video_file', 'video_url', 'video_duration',
            'file', 'content', 'external_url', 'thumbnail',
            'author_name', 'source', 'tags',
            'access_level', 'allow_download',
            'is_published', 'is_featured',
        ]

    def validate(self, attrs):
        rtype = attrs.get(
            'resource_type',
            self.instance.resource_type if self.instance else None
        )

        if rtype == 'video':
            has_file = attrs.get('video_file') or (self.instance and self.instance.video_file)
            has_url  = attrs.get('video_url')  or (self.instance and self.instance.video_url)
            if not has_file and not has_url:
                raise serializers.ValidationError(
                    "Video resources require either video_file or video_url."
                )

        if rtype == 'link':
            if not (attrs.get('external_url') or (self.instance and self.instance.external_url)):
                raise serializers.ValidationError("Link resources require external_url.")

        if rtype in ('pdf', 'document', 'presentation'):
            if not (attrs.get('file') or (self.instance and self.instance.file)):
                raise serializers.ValidationError(f"{rtype.title()} resources require a file upload.")

        if rtype == 'post':
            if not (attrs.get('content') or (self.instance and self.instance.content)):
                raise serializers.ValidationError("Post resources require content.")

        return attrs


# ---------------------------------------------------------------------------
# ResourceCollection
# ---------------------------------------------------------------------------
class ResourceCollectionSerializer(serializers.ModelSerializer):
    resource_count = serializers.SerializerMethodField()

    class Meta:
        model  = ResourceCollection
        fields = [
            'id', 'name', 'slug', 'description',
            'resources', 'cover_image',
            'created_by', 'is_public', 'is_featured',
            'resource_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_by', 'created_at', 'updated_at']

    def get_resource_count(self, obj):
        return obj.resources.count()


# ---------------------------------------------------------------------------
# ResourceBookmark
# ---------------------------------------------------------------------------
class ResourceBookmarkSerializer(serializers.ModelSerializer):
    resource_title = serializers.CharField(source='resource.title', read_only=True)

    class Meta:
        model  = ResourceBookmark
        fields = ['id', 'resource', 'resource_title', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


# ---------------------------------------------------------------------------
# ResourceRating
# ---------------------------------------------------------------------------
class ResourceRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResourceRating
        fields = ['id', 'resource', 'rating', 'review', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']