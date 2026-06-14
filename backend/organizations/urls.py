"""
Organizations – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'regions',     views.RegionViewSet,                    basename='region')
router.register(r'schools',     views.SchoolViewSet,                    basename='school')
router.register(r'classes',     views.ClassGroupViewSet,                basename='class')
router.register(r'assignments', views.TeacherClassAssignmentViewSet,    basename='assignment')

urlpatterns = [
    path('', include(router.urls)),
]