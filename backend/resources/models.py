"""
Resources models - Educational resources (videos, PDFs, posts, links)
"""

from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator, URLValidator


class Category(models.Model):
    """Subject categories (Math, History, Physics, etc.)"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    # Icon/Image
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or emoji")
    color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code")
    
    # Hierarchy (parent category)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories'
    )
    
    # Display order
    order = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resource_categories'
        ordering = ['order', 'name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['parent', 'order']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def total_resources(self):
        return self.resources.filter(is_published=True).count()


class Resource(models.Model):
    """Educational resource"""
    
    RESOURCE_TYPE_CHOICES = [
        ('video', 'Video'),
        ('pdf', 'PDF Document'),
        ('post', 'Article/Post'),
        ('link', 'External Link'),
        ('document', 'Document'),
        ('presentation', 'Presentation'),
    ]
    
    ACCESS_LEVEL_CHOICES = [
        ('public', 'Public - All users'),
        ('students', 'Students only'),
        ('registered', 'Registered users only'),
        ('premium', 'Premium/Paid'),
    ]
    
    # Basic info
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=350, unique=True, blank=True)
    description = models.TextField(help_text="Resource description")
    
    # Type and category
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='resources'
    )
    
    # Content based on type
    # For videos
    video_file = models.FileField(
        upload_to='resources/videos/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['mp4', 'webm', 'ogg', 'avi', 'mov'])]
    )
    video_url = models.URLField(
        blank=True,
        help_text="YouTube, Vimeo, or other video URL"
    )
    video_duration = models.IntegerField(
        default=0,
        help_text="Duration in seconds"
    )
    
    # For PDFs and documents
    file = models.FileField(
        upload_to='resources/files/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator([
            'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'
        ])]
    )
    
    # For posts/articles
    content = models.TextField(
        blank=True,
        help_text="Full content for posts/articles (supports Markdown/HTML)"
    )
    
    # For external links
    external_url = models.URLField(
        blank=True,
        validators=[URLValidator()]
    )
    
    # Thumbnail/Cover
    thumbnail = models.ImageField(
        upload_to='resources/thumbnails/%Y/%m/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    
    # Metadata
    author_name = models.CharField(max_length=200, blank=True)
    source = models.CharField(max_length=300, blank=True, help_text="Original source")
    
    # Tags
    tags = models.JSONField(default=list, blank=True)
    
    # Access control
    access_level = models.CharField(
        max_length=20,
        choices=ACCESS_LEVEL_CHOICES,
        default='public'
    )
    
    # Downloadable
    allow_download = models.BooleanField(default=True)
    
    # Publishing
    is_published = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    
    # Uploaded by
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_resources'
    )
    
    # Engagement
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    
    # File size
    file_size = models.BigIntegerField(default=0, help_text="Size in bytes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resources'
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['resource_type', '-created_at']),
            models.Index(fields=['is_published', '-created_at']),
            models.Index(fields=['uploaded_by', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_resource_type_display()})"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Calculate file size
        if self.file and not self.file_size:
            self.file_size = self.file.size
        elif self.video_file and not self.file_size:
            self.file_size = self.video_file.size
        
        super().save(*args, **kwargs)
    
    def increment_views(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_downloads(self):
        """Increment download count"""
        self.download_count += 1
        self.save(update_fields=['download_count'])
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0


class ResourceCollection(models.Model):
    """Curated collections of resources"""
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField()
    
    resources = models.ManyToManyField(
        Resource,
        related_name='collections',
        blank=True
    )
    
    # Cover image
    cover_image = models.ImageField(
        upload_to='collections/covers/',
        blank=True,
        null=True
    )
    
    # Created by
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='resource_collections'
    )
    
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resource_collections'
        ordering = ['-is_featured', '-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ResourceBookmark(models.Model):
    """User bookmarks for resources"""
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='resource_bookmarks'
    )
    
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    
    notes = models.TextField(blank=True, help_text="User's personal notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'resource_bookmarks'
        unique_together = [['user', 'resource']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} bookmarked {self.resource.title}"


class ResourceRating(models.Model):
    """User ratings for resources"""
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='resource_ratings'
    )
    
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="Rating from 1 to 5"
    )
    
    review = models.TextField(blank=True, max_length=500)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resource_ratings'
        unique_together = [['user', 'resource']]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['resource', '-rating']),
        ]
    
    def __str__(self):
        return f"{self.user.username} rated {self.resource.title}: {self.rating}/5"