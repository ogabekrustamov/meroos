"""
Accounts – tests for the superuser-only UserAdminViewSet (/api/auth/users/).
"""

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import TeacherPermission, StudentProfile

User = get_user_model()


class UserAdminBaseTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin', password='password123')
        self.teacher = User.objects.create_user(
            username='teacher', password='password123', role='teacher',
            first_name='Tina', last_name='Teacher', email='tina@example.com',
        )
        self.student = User.objects.create_user(
            username='student', password='password123', role='student',
            first_name='Sam', last_name='Student',
        )
        self.list_url = reverse('user-admin-list')

    def detail_url(self, pk):
        return reverse('user-admin-detail', kwargs={'pk': pk})


class UserAdminPermissionTest(UserAdminBaseTest):
    def test_unauthenticated_denied(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_forbidden(self):
        self.client.force_authenticate(user=self.teacher)
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_student_forbidden(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_non_superuser_cannot_create(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(self.list_url, {
            'username': 'hacker', 'password': 'password123', 'role': 'superuser',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(username='hacker').exists())


class UserAdminListTest(UserAdminBaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_lists_all_users(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)

    def test_filter_by_role(self):
        response = self.client.get(self.list_url, {'role': 'teacher'})
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['username'], 'teacher')

    def test_filter_by_is_active(self):
        self.teacher.is_active = False
        self.teacher.save(update_fields=['is_active'])
        response = self.client.get(self.list_url, {'is_active': 'false'})
        results = response.data.get('results', response.data)
        self.assertEqual([u['username'] for u in results], ['teacher'])

    def test_search_matches_name_and_email(self):
        by_name = self.client.get(self.list_url, {'search': 'Tina'})
        self.assertEqual(len(by_name.data.get('results', by_name.data)), 1)
        by_email = self.client.get(self.list_url, {'search': 'tina@example'})
        self.assertEqual(len(by_email.data.get('results', by_email.data)), 1)


class UserAdminCreateTest(UserAdminBaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_create_student_creates_profile(self):
        response = self.client.post(self.list_url, {
            'username': 'newstudent', 'password': 'StrongPass!234', 'role': 'student',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newstudent')
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_teacher_creates_permissions(self):
        response = self.client.post(self.list_url, {
            'username': 'newteacher', 'password': 'StrongPass!234', 'role': 'teacher',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newteacher')
        self.assertTrue(TeacherPermission.objects.filter(teacher=user).exists())

    def test_create_superuser_sets_flags(self):
        response = self.client.post(self.list_url, {
            'username': 'newadmin', 'password': 'StrongPass!234', 'role': 'superuser',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newadmin')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)

    def test_create_requires_password(self):
        response = self.client.post(self.list_url, {'username': 'nopass', 'role': 'student'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='nopass').exists())

    def test_create_rejects_duplicate_username(self):
        response = self.client.post(self.list_url, {
            'username': 'teacher', 'password': 'StrongPass!234', 'role': 'student',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_weak_password(self):
        response = self.client.post(self.list_url, {
            'username': 'weak', 'password': '123', 'role': 'student',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserAdminUpdateTest(UserAdminBaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_deactivate_and_rename(self):
        response = self.client.patch(self.detail_url(self.student.pk), {
            'is_active': False, 'last_name': 'Renamed',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_active)
        self.assertEqual(self.student.last_name, 'Renamed')

    def test_promote_student_to_teacher_creates_permissions(self):
        response = self.client.patch(self.detail_url(self.student.pk), {'role': 'teacher'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'teacher')
        self.assertTrue(TeacherPermission.objects.filter(teacher=self.student).exists())

    def test_demoting_superuser_clears_flags(self):
        other_admin = User.objects.create_superuser(username='admin2', password='password123')
        response = self.client.patch(self.detail_url(other_admin.pk), {'role': 'teacher'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        other_admin.refresh_from_db()
        self.assertFalse(other_admin.is_superuser)
        self.assertFalse(other_admin.is_staff)

    def test_update_password_changes_login(self):
        self.client.patch(self.detail_url(self.student.pk), {'password': 'brandNewPass1'})
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password('brandNewPass1'))

    def test_cannot_demote_self(self):
        response = self.client.patch(self.detail_url(self.admin.pk), {'role': 'teacher'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_superuser)

    def test_cannot_deactivate_self(self):
        response = self.client.patch(self.detail_url(self.admin.pk), {'is_active': False})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_can_still_edit_own_profile_fields(self):
        response = self.client.patch(self.detail_url(self.admin.pk), {'first_name': 'Boss'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.first_name, 'Boss')


class UserAdminResetPasswordTest(UserAdminBaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_reset_password_succeeds(self):
        url = reverse('user-admin-reset-password', kwargs={'pk': self.student.pk})
        response = self.client.post(url, {'password': 'resetPass789'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password('resetPass789'))

    def test_reset_password_requires_value(self):
        url = reverse('user-admin-reset-password', kwargs={'pk': self.student.pk})
        self.assertEqual(self.client.post(url, {}).status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_rejects_weak(self):
        url = reverse('user-admin-reset-password', kwargs={'pk': self.student.pk})
        self.assertEqual(self.client.post(url, {'password': '123'}).status_code, status.HTTP_400_BAD_REQUEST)


class UserAdminDeleteTest(UserAdminBaseTest):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_delete_user(self):
        response = self.client.delete(self.detail_url(self.student.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.student.pk).exists())

    def test_cannot_delete_self(self):
        response = self.client.delete(self.detail_url(self.admin.pk))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=self.admin.pk).exists())

