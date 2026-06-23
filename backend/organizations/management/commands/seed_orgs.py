"""
Management command to make the platform operable out of the box:

  1. Seeds the organizational hierarchy (Region -> School -> Class) if empty.
  2. Attaches teachers and students without a school to the demo school.
  3. Assigns unassigned students to a class.
  4. Backfills TeacherPermission rows for teachers that are missing one,
     granting a sensible default teaching permission set.

The command is idempotent — running it repeatedly will not create duplicates
and (by default) will not overwrite existing data.

Usage:
    python manage.py seed_orgs
    python manage.py seed_orgs --reset-existing-permissions
    python manage.py seed_orgs --academic-year 2025-2026
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User, TeacherPermission, StudentProfile
from organizations.models import Region, School, ClassGroup


# Permissions granted to teachers when we create (or, with the flag, reset)
# their permission row. Delete and school/class-creation rights stay with the
# superuser and are intentionally left off.
DEFAULT_TEACHER_PERMISSIONS = {
    'can_create_news': True,
    'can_edit_news': True,
    'can_delete_news': False,
    'can_upload_resources': True,
    'can_edit_resources': True,
    'can_delete_resources': False,
    'can_create_quizzes': True,
    'can_edit_quizzes': True,
    'can_delete_quizzes': False,
    'can_host_kahoot': True,
    'can_create_students': True,
    'can_manage_classes': True,
    'can_view_student_stats': True,
    'can_create_schools': False,
    'can_create_classes': False,
}


class Command(BaseCommand):
    help = "Seed the organization hierarchy and backfill teacher permissions."

    def add_arguments(self, parser):
        parser.add_argument(
            '--academic-year',
            default='2024-2025',
            help="Academic year for seeded classes (default: 2024-2025).",
        )
        parser.add_argument(
            '--reset-existing-permissions',
            action='store_true',
            help="Also apply the default permission set to teachers who already "
                 "have a permission row (otherwise only missing rows are created).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        academic_year = options['academic_year']
        reset_existing = options['reset_existing_permissions']

        admin = User.objects.filter(role='superuser').order_by('id').first()

        region, school = self._seed_region_and_school(admin)
        classes = self._seed_classes(school, academic_year, admin)
        self._attach_users_to_school(school)
        self._assign_students_to_classes(classes)
        self._backfill_teacher_permissions(reset_existing)

        self.stdout.write(self.style.SUCCESS("\nDone. Platform org data is ready."))

    # ------------------------------------------------------------------ helpers

    def _seed_region_and_school(self, admin):
        region, created = Region.objects.get_or_create(
            code='TSH',
            defaults={
                'name': 'Tashkent',
                'description': 'Default seeded region.',
                'created_by': admin,
            },
        )
        self._report('Region', region.name, created)

        school, created = School.objects.get_or_create(
            region=region,
            school_number='1',
            defaults={
                'name': 'Meroos Demo School',
                'address': 'Tashkent, Uzbekistan',
                'created_by': admin,
            },
        )
        self._report('School', school.full_name, created)
        return region, school

    def _seed_classes(self, school, academic_year, admin):
        wanted = [
            {'name': '9-A', 'grade_level': 9, 'section': 'A'},
            {'name': '10-B', 'grade_level': 10, 'section': 'B'},
            {'name': '11-A', 'grade_level': 11, 'section': 'A'},
        ]
        classes = []
        for spec in wanted:
            cg, created = ClassGroup.objects.get_or_create(
                school=school,
                grade_level=spec['grade_level'],
                section=spec['section'],
                academic_year=academic_year,
                defaults={
                    'name': spec['name'],
                    'created_by': admin,
                },
            )
            classes.append(cg)
            self._report('Class', str(cg), created)
        return classes

    def _attach_users_to_school(self, school):
        updated = (
            User.objects
            .filter(role__in=['teacher', 'student'], school__isnull=True)
            .update(school=school)
        )
        if updated:
            self.stdout.write(
                f"  Attached {updated} teacher(s)/student(s) without a school to {school.full_name}."
            )

    def _assign_students_to_classes(self, classes):
        if not classes:
            return
        count = 0
        students = User.objects.filter(role='student')
        for idx, student in enumerate(students):
            profile, _ = StudentProfile.objects.get_or_create(user=student)
            if profile.class_group is None:
                profile.class_group = classes[idx % len(classes)]
                profile.save(update_fields=['class_group'])
                count += 1
        if count:
            self.stdout.write(f"  Assigned {count} unassigned student(s) to a class.")

    def _backfill_teacher_permissions(self, reset_existing):
        created_count = 0
        reset_count = 0
        for teacher in User.objects.filter(role='teacher'):
            perms, created = TeacherPermission.objects.get_or_create(
                teacher=teacher,
                defaults=DEFAULT_TEACHER_PERMISSIONS,
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created permissions for teacher '{teacher.username}'.")
            elif reset_existing:
                for field, value in DEFAULT_TEACHER_PERMISSIONS.items():
                    setattr(perms, field, value)
                perms.save()
                reset_count += 1
                self.stdout.write(f"  Reset permissions for teacher '{teacher.username}'.")

        self.stdout.write(
            f"  Teacher permissions: {created_count} created"
            + (f", {reset_count} reset" if reset_existing else "")
            + "."
        )

    def _report(self, kind, label, created):
        verb = self.style.SUCCESS('created') if created else 'exists'
        self.stdout.write(f"  {kind}: {label} [{verb}]")
