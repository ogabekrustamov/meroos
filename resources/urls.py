"""
Resources – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories',   views.CategoryViewSet,          basename='resource-category')
router.register(r'',             views.ResourceViewSet,          basename='resource')
router.register(r'collections',  views.ResourceCollectionViewSet, basename='resource-collection')
router.register(r'bookmarks',    views.ResourceBookmarkViewSet,  basename='resource-bookmark')
router.register(r'ratings',      views.ResourceRatingViewSet,    basename='resource-rating')

urlpatterns = [
    path('', include(router.urls)),
]