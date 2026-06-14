"""
Resources – admin
"""

from django.contrib import admin
from .models import Category, Resource, ResourceCollection, ResourceBookmark, ResourceRating


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display        = ('name', 'slug', 'parent', 'icon', 'color', 'order', 'is_active', 'total_resources')
    list_filter         = ('parent', 'is_active')
    search_fields       = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering            = ('order', 'name')
    list_per_page       = 50


# ---------------------------------------------------------------------------
# Resource
# ---------------------------------------------------------------------------
class ResourceRatingInline(admin.TabularInline):
    model         = ResourceRating
    extra         = 0
    readonly_fields = ('user', 'rating', 'created_at')


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display        = ('title', 'resource_type', 'category', 'uploaded_by',
                           'is_published', 'is_featured', 'view_count', 'download_count', 'created_at')
    list_filter         = ('resource_type', 'category', 'is_published', 'is_featured', 'access_level')
    search_fields       = ('title', 'description', 'tags')
    raw_id_fields       = ('uploaded_by', 'category')
    list_select_related = ('category', 'uploaded_by')
    list_per_page       = 50
    ordering            = ('-created_at',)
    date_hierarchy      = 'created_at'

    inlines = [ResourceRatingInline]

    fieldsets = (
        ('Basic Info',     {'fields': ('title', 'slug', 'description', 'thumbnail')}),
        ('Type & Category',{'fields': ('resource_type', 'category')}),
        ('Video',          {'fields': ('video_file', 'video_url', 'video_duration'), 'classes': ('collapse',)}),
        ('File',           {'fields': ('file',), 'classes': ('collapse',)}),
        ('Post Content',   {'fields': ('content',), 'classes': ('collapse',)}),
        ('External Link',  {'fields': ('external_url',), 'classes': ('collapse',)}),
        ('Metadata',       {'fields': ('author_name', 'source', 'tags')}),
        ('Access',         {'fields': ('access_level', 'allow_download', 'is_published', 'is_featured')}),
        ('Stats',          {'fields': ('view_count', 'download_count', 'file_size'), 'classes': ('collapse',)}),
    )
    readonly_fields     = ('view_count', 'download_count', 'file_size')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(ResourceCollection)
class ResourceCollectionAdmin(admin.ModelAdmin):
    list_display        = ('name', 'created_by', 'is_public', 'is_featured')
    filter_horizontal   = ('resources',)
    raw_id_fields       = ('created_by',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ResourceBookmark)
class ResourceBookmarkAdmin(admin.ModelAdmin):
    list_display        = ('user', 'resource', 'created_at')
    raw_id_fields       = ('user', 'resource')
    list_select_related = ('user', 'resource')
    list_per_page       = 100


@admin.register(ResourceRating)
class ResourceRatingAdmin(admin.ModelAdmin):
    list_display        = ('user', 'resource', 'rating', 'created_at')
    list_filter         = ('rating',)
    raw_id_fields       = ('user', 'resource')
    list_select_related = ('user', 'resource')