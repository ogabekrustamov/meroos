"""
News – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories',   views.NewsCategoryViewSet,   basename='news-category')
router.register(r'posts',        views.NewsPostViewSet,       basename='news-post')
router.register(r'comments',     views.NewsCommentViewSet,    basename='news-comment')
router.register(r'attachments',  views.NewsAttachmentViewSet, basename='news-attachment')

urlpatterns = [
    path('', include(router.urls)),
]