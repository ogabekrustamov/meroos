"""
Resources – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# NOTE: the ResourceViewSet is registered with an empty prefix, whose detail
# route (^(?P<pk>[^/.]+)/$) would otherwise shadow every sibling prefix below
# it (e.g. /resources/bookmarks/ would resolve to a resource with pk="bookmarks").
# It must be registered LAST so the named prefixes win during URL resolution.
router.register(r'categories',   views.CategoryViewSet,           basename='resource-category')
router.register(r'collections',  views.ResourceCollectionViewSet, basename='resource-collection')
router.register(r'bookmarks',    views.ResourceBookmarkViewSet,   basename='resource-bookmark')
router.register(r'ratings',      views.ResourceRatingViewSet,     basename='resource-rating')
router.register(r'',             views.ResourceViewSet,           basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]