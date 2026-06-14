"""
Quizzes – URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'kahoot-rooms', views.KahootRoomViewSet,    basename='kahoot-room')
router.register(r'attempts',     views.QuizAttemptViewSet,   basename='quiz-attempt')
router.register(r'',             views.QuizViewSet,          basename='quiz')

urlpatterns = [
    path('', include(router.urls)),
]