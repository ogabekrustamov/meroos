"""
Organizations – tests for region/school admin management used by the
Organization Management page.
"""

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from organizations.models import Region, School

User = get_user_model()


class OrganizationAdminTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='admin', password='password123')
        self.teacher = User.objects.create_user(username='teacher', password='password123', role='teacher')
        self.region = Region.objects.create(name='Existing Region', code='EXR')

        self.regions_url = reverse('region-list')
        self.schools_url = reverse('school-list')

    # ----- Regions -----
    def test_superuser_can_create_region(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.regions_url, {'name': 'New Region', 'code': 'NEW'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Region.objects.filter(name='New Region').exists())

    def test_non_superuser_cannot_create_region(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(self.regions_url, {'name': 'Sneaky', 'code': 'SNK'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Region.objects.filter(name='Sneaky').exists())

    def test_anyone_authenticated_can_list_regions(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.regions_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    # ----- Schools -----
    def test_create_school_resolves_region_name(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.schools_url, {
            'name': 'Central School', 'school_number': '41', 'region': self.region.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['region_name'], 'Existing Region')
        self.assertTrue(School.objects.filter(name='Central School').exists())

    def test_create_school_requires_region(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.schools_url, {'name': 'Orphan', 'school_number': '99'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_superuser_can_delete_school(self):
        school = School.objects.create(name='Temp', school_number='7', region=self.region)
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(reverse('school-detail', kwargs={'pk': school.pk}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
