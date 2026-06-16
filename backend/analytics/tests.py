"""
Analytics – tests for the superuser-only platform-stats endpoint.
"""

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from organizations.models import Region, School, ClassGroup
from resources.models import Category
from quizzes.models import Quiz, QuizAttempt

User = get_user_model()


class PlatformStatsTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin', password='password123')
        self.teacher = User.objects.create_user(username='teacher', password='password123', role='teacher')
        self.student = User.objects.create_user(username='student', password='password123', role='student')

        self.region = Region.objects.create(name='Region One', code='R1')
        self.school = School.objects.create(name='School One', school_number='1', region=self.region)
        self.klass = ClassGroup.objects.create(
            name='9-A', grade_level=9, section='A', school=self.school, academic_year='2024-2025',
        )

        self.category = Category.objects.create(name='General', slug='general')
        self.quiz = Quiz.objects.create(
            title='Quiz One', category=self.category, created_by=self.teacher, is_published=True,
        )
        QuizAttempt.objects.create(quiz=self.quiz, user=self.student)
        QuizAttempt.objects.create(quiz=self.quiz, user=self.student)

        self.url = reverse('analytics-platform-stats')

    def test_requires_superuser(self):
        self.client.force_authenticate(user=self.teacher)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_denied(self):
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_expected_structure(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ('users', 'organizations', 'quizzes', 'recent_activity'):
            self.assertIn(key, response.data)

    def test_user_counts(self):
        self.client.force_authenticate(user=self.admin)
        users = self.client.get(self.url).data['users']
        self.assertEqual(users['total'], 3)
        self.assertEqual(users['active'], 3)
        self.assertEqual(users['superusers'], 1)
        self.assertEqual(users['teachers'], 1)
        self.assertEqual(users['students'], 1)
        self.assertEqual(users['guests'], 0)

    def test_organization_counts(self):
        self.client.force_authenticate(user=self.admin)
        orgs = self.client.get(self.url).data['organizations']
        self.assertEqual(orgs['regions'], 1)
        self.assertEqual(orgs['schools'], 1)
        self.assertEqual(orgs['classes'], 1)

    def test_quiz_counts(self):
        self.client.force_authenticate(user=self.admin)
        quizzes = self.client.get(self.url).data['quizzes']
        self.assertEqual(quizzes['total'], 1)
        self.assertEqual(quizzes['published'], 1)
        self.assertEqual(quizzes['attempts'], 2)
