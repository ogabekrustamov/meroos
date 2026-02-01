"""
News models - Blog posts, announcements, news articles
"""

from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator


class NewsCategory(models.Model):
    """Categories for news posts"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    # Display order
    order = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'news_categories'
        ordering = ['order', 'name']
        verbose_name = 'News Category'
        verbose_name_plural = 'News Categories'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class NewsPost(models.Model):
    """News/Blog post"""
    
    POST_TYPE_CHOICES = [
        ('news', 'News'),
        ('announcement', 'Announcement'),
        ('blog', 'Blog Post'),
        ('update', 'Update'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    # Basic info
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=350, unique=True, blank=True)
    
    # Content
    excerpt = models.TextField(
        max_length=500,
        help_text="Short description for previews"
    )
    content = models.TextField(help_text="Full content (supports Markdown/HTML)")
    
    # Media
    featured_image = models.ImageField(
        upload_to='news/images/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    
    # Classification
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default='news')
    category = models.ForeignKey(
        NewsCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts'
    )
    
    # Tags
    tags = models.JSONField(default=list, blank=True, null=True, help_text="List of tags")
    
    # Author
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='news_posts'
    )
    
    # Publishing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    # Featured/Pinned
    is_featured = models.BooleanField(default=False, db_index=True)
    is_pinned = models.BooleanField(default=False, db_index=True)
    
    # Engagement
    view_count = models.IntegerField(default=0)
    
    # SEO
    meta_description = models.CharField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'news_posts'
        ordering = ['-is_pinned', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-published_at', 'status']),
            models.Index(fields=['author', '-published_at']),
            models.Index(fields=['category', '-published_at']),
            models.Index(fields=['is_featured', '-published_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Auto-set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        
        # Ensure tags is never None
        if self.tags is None:
            self.tags = []
        
        super().save(*args, **kwargs)
    
    @property
    def is_published(self):
        return self.status == 'published' and self.published_at and self.published_at <= timezone.now()
    
    def increment_views(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class NewsComment(models.Model):
    """Comments on news posts"""
    
    post = models.ForeignKey(
        NewsPost,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='news_comments'
    )
    
    content = models.TextField(max_length=1000)
    
    # Nested comments
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    is_approved = models.BooleanField(default=True)
    is_edited = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'news_comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"


class NewsAttachment(models.Model):
    """Additional files attached to news posts"""
    
    post = models.ForeignKey(
        NewsPost,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    
    file = models.FileField(
        upload_to='news/attachments/%Y/%m/',
        validators=[FileExtensionValidator([
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'
        ])]
    )
    
    filename = models.CharField(max_length=255, blank=True)
    description = models.CharField(max_length=300, blank=True)
    file_size = models.IntegerField(default=0, help_text="Size in bytes")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'news_attachments'
        ordering = ['uploaded_at']
    
    def __str__(self):
        return self.filename or str(self.file)
    
    def save(self, *args, **kwargs):
        if not self.filename and self.file:
            self.filename = self.file.name
        
        if self.file and not self.file_size:
            self.file_size = self.file.size
        
        super().save(*args, **kwargs)