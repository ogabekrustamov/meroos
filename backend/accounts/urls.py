"""
Accounts – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users',    views.UserAdminViewSet,      basename='user-admin')
router.register(r'students', views.StudentProfileViewSet, basename='student-profile')
router.register(r'',         views.AuthViewSet,           basename='auth')

urlpatterns = [
    path('', include(router.urls)),
]