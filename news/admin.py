"""
News – admin
"""

from django.contrib import admin
from django import forms
from .models import NewsCategory, NewsPost, NewsComment, NewsAttachment


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display       = ('name', 'slug', 'order', 'is_active')
    list_filter        = ('is_active',)
    search_fields      = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering           = ('order', 'name')


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------
class NewsCommentInline(admin.TabularInline):
    model         = NewsComment
    extra         = 0
    readonly_fields = ('author', 'created_at')


class NewsAttachmentInline(admin.TabularInline):
    model         = NewsAttachment
    extra         = 0
    readonly_fields = ('filename', 'file_size', 'uploaded_at')


# ---------------------------------------------------------------------------
# NewsPost
# ---------------------------------------------------------------------------
class NewsPostAdminForm(forms.ModelForm):
    class Meta:
        model = NewsPost
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            self.fields['tags'].initial = []


@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    form = NewsPostAdminForm
    list_display        = ('title', 'author', 'post_type', 'category', 'status',
                           'is_featured', 'is_pinned', 'view_count', 'published_at')
    list_filter         = ('status', 'post_type', 'category', 'is_featured', 'is_pinned')
    search_fields       = ('title', 'excerpt', 'content')
    date_hierarchy      = 'created_at'
    raw_id_fields       = ('author',)
    list_select_related = ('author', 'category')
    list_per_page       = 30
    ordering            = ('-is_pinned', '-published_at')

    inlines = [NewsAttachmentInline, NewsCommentInline]

    fieldsets = (
        ('Content',        {'fields': ('title', 'slug', 'excerpt', 'content', 'featured_image')}),
        ('Classification', {'fields': ('post_type', 'category', 'tags')}),
        ('Publishing',     {'fields': ('status', 'is_featured', 'is_pinned', 'published_at')}),
        ('SEO',            {'fields': ('meta_description', 'meta_keywords')}),
        ('Meta',           {'fields': ('author', 'view_count', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields      = ('view_count', 'created_at', 'updated_at')
    prepopulated_fields  = {'slug': ('title',)}


@admin.register(NewsComment)
class NewsCommentAdmin(admin.ModelAdmin):
    list_display        = ('author', 'post', 'is_approved', 'parent', 'created_at')
    list_filter         = ('is_approved',)
    search_fields       = ('author__username', 'content', 'post__title')
    raw_id_fields       = ('author', 'post', 'parent')
    list_select_related = ('author', 'post')
    list_per_page       = 100


@admin.register(NewsAttachment)
class NewsAttachmentAdmin(admin.ModelAdmin):
    list_display        = ('filename', 'post', 'file_size', 'uploaded_at')
    search_fields       = ('filename', 'post__title')
    raw_id_fields       = ('post',)
    list_select_related = ('post',)