"""
Analytics – URL configuration

All routes are custom actions on a single ViewSet — no standard CRUD.

  GET /api/analytics/my-stats/
  GET /api/analytics/student-stats/<student_user_id>/
  GET /api/analytics/class-stats/<class_group_id>/
  GET /api/analytics/quiz-stats/<quiz_id>/
  GET /api/analytics/leaderboard/
  GET /api/analytics/daily-activity/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]