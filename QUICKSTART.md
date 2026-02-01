# Meroos Backend - Quick Start Guide

## Prerequisites
- Python 3.10+
- PostgreSQL 14+ (or use SQLite for development)
- Redis 6.0+

---

## Quick Setup (Development)

### 1. Initial Setup (5 minutes)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create Django project and apps
django-admin startproject config .
python manage.py startapp accounts
python manage.py startapp organizations
python manage.py startapp news
python manage.py startapp resources
python manage.py startapp quizzes
python manage.py startapp analytics
```

### 2. Copy Provided Files

```bash
# Configuration
cp config_settings.py config/settings.py
cp config_urls.py config/urls.py
cp config_asgi.py config/asgi.py
cp config_celery.py config/celery.py

# Models
cp accounts_models.py accounts/models.py
cp organizations_models.py organizations/models.py
cp news_models.py news/models.py
cp resources_models.py resources/models.py
cp quizzes_models.py quizzes/models.py
cp analytics_models.py analytics/models.py

# Permissions
cp accounts_permissions.py accounts/permissions.py

# WebSocket
cp quizzes_consumers.py quizzes/consumers.py
cp quizzes_routing.py quizzes/routing.py

# Environment
cp .env.example .env
```

### 3. Configure Environment

```bash
# Generate secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Edit .env and add the secret key
nano .env
# Set: SECRET_KEY=<generated_key>
# Set: DEBUG=True
```

### 4. Create Required Directories

```bash
mkdir -p media/{avatars,news/{images,attachments},resources/{videos,files,thumbnails},quizzes/{thumbnails,questions,options}}
mkdir -p static staticfiles logs
```

### 5. Database Setup

```bash
# Make migrations
python manage.py makemigrations accounts
python manage.py makemigrations organizations
python manage.py makemigrations news
python manage.py makemigrations resources
python manage.py makemigrations quizzes
python manage.py makemigrations analytics

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
# Username: admin
# Password: (choose secure password)
```

### 6. Run Development Server

**Terminal 1 - Django (with WebSocket support):**
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Terminal 2 - Celery Worker:**
```bash
celery -A config worker -l info
```

**Terminal 3 - Celery Beat:**
```bash
celery -A config beat -l info
```

### 7. Access the Application

- **API Root**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Swagger Docs**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Schema download**: http://localhost:8000/api/schema/
---

## Essential Management Commands

### Database Operations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (DANGER!)
python manage.py flush

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

### Running Servers

```bash
# Development server (HTTP only)
python manage.py runserver

# Development server with WebSocket (recommended)
daphne config.asgi:application

# Specify port
daphne -p 8080 config.asgi:application

# Celery worker
celery -A config worker -l info

# Celery worker with auto-reload (development)
watchmedo auto-restart -d . -p '*.py' -- celery -A config worker -l info

# Celery beat (scheduled tasks)
celery -A config beat -l info
```

### Static Files

```bash
# Collect static files
python manage.py collectstatic

# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

---

## Quick Data Population (Django Shell)

```bash
python manage.py shell
```

```python
from accounts.models import User, TeacherPermission, StudentProfile
from organizations.models import Region, School, ClassGroup
from resources.models import Category
from news.models import NewsCategory

# Create regions
tashkent = Region.objects.create(name="Tashkent", code="TSH")
samarkand = Region.objects.create(name="Samarkand", code="SAM")

# Create categories
math = Category.objects.create(name="Mathematics", icon="📐", color="#3B82F6")
physics = Category.objects.create(name="Physics", icon="⚛️", color="#10B981")
history = Category.objects.create(name="History", icon="📜", color="#F59E0B")

# Create news categories
announcements = NewsCategory.objects.create(name="Announcements", order=1)
updates = NewsCategory.objects.create(name="Updates", order=2)

# Create school
school = School.objects.create(
    name="Excellence School",
    school_number="41",
    region=tashkent,
    address="123 Main St, Tashkent"
)

# Create class
class_9a = ClassGroup.objects.create(
    name="9-A",
    grade_level=9,
    section="A",
    school=school,
    academic_year="2024-2025",
    max_students=30
)

# Create teacher
teacher = User.objects.create_user(
    username='teacher1',
    password='teacher123',
    role='teacher',
    first_name='John',
    last_name='Doe',
    school=school
)

# Grant all permissions to teacher
perms = TeacherPermission.objects.create(
    teacher=teacher,
    can_create_news=True,
    can_edit_news=True,
    can_delete_news=True,
    can_upload_resources=True,
    can_edit_resources=True,
    can_delete_resources=True,
    can_create_quizzes=True,
    can_edit_quizzes=True,
    can_delete_quizzes=True,
    can_host_kahoot=True,
    can_create_students=True,
    can_manage_classes=True,
    can_view_student_stats=True,
    can_create_schools=False,
    can_create_classes=True
)

# Assign teacher to class
class_9a.assigned_teachers.add(teacher)

# Create student
student = User.objects.create_user(
    username='student1',
    password='student123',
    role='student',
    first_name='Jane',
    last_name='Smith',
    school=school
)

# Create student profile
profile = StudentProfile.objects.create(
    student=student,
    class_group=class_9a,
    student_id='STU2024001'
)

print("✅ Sample data created successfully!")
print(f"Teacher: {teacher.username} / teacher123")
print(f"Student: {student.username} / student123")
```

---

## Testing API Endpoints

### Using curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}'

# Get token and use it
TOKEN="your-access-token-here"

# Get profile
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer $TOKEN"

# List quizzes
curl http://localhost:8000/api/quizzes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Using Python requests

```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login/', json={
    'username': 'student1',
    'password': 'student123'
})

token = response.json()['access']

# Use token
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/quizzes/', headers=headers)
print(response.json())
```

---

## Common Issues & Solutions

### Issue: Module not found
```bash
# Solution: Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database errors
```bash
# Solution: Delete and recreate database
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Issue: Redis connection refused
```bash
# Solution: Start Redis
# Linux/Mac:
redis-server

# Or check if running:
redis-cli ping  # Should return PONG
```

### Issue: Port already in use
```bash
# Solution: Find and kill process
# Linux/Mac:
lsof -i :8000
kill -9 <PID>

# Or use different port:
daphne -p 8080 config.asgi:application
```

### Issue: Permission denied
```bash
# Solution: Fix file permissions
chmod +x manage.py
chmod -R 755 media/
chmod -R 755 logs/
```

---

## Production Deployment Checklist

- [ ] Set `DEBUG=False` in .env
- [ ] Generate new `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Set up Redis
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up Gunicorn
- [ ] Set up Nginx
- [ ] Configure SSL with Let's Encrypt
- [ ] Set up Celery as systemd service
- [ ] Configure static file serving
- [ ] Set up backup system
- [ ] Configure logging
- [ ] Set up monitoring (optional)
- [ ] Run `collectstatic`
- [ ] Test all endpoints

---

## Useful Commands Reference

```bash
# Show migrations
python manage.py showmigrations

# SQL for migration
python manage.py sqlmigrate accounts 0001

# Check for issues
python manage.py check

# Create dummy data
python manage.py loaddata fixtures/initial_data.json

# Dump data
python manage.py dumpdata accounts --indent 2 > fixtures/accounts.json

# Clear sessions
python manage.py clearsessions

# Run tests
python manage.py test

# Run specific test
python manage.py test accounts.tests.TestUserModel

# Coverage report
coverage run --source='.' manage.py test
coverage report
coverage html
```

---

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**
   - Update models
   - Create/update serializers
   - Create/update views
   - Add tests

3. **Create migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Test**
   ```bash
   python manage.py test
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

---

## Getting Help

- **Django Documentation**: https://docs.djangoproject.com/
- **DRF Documentation**: https://www.django-rest-framework.org/
- **Channels Documentation**: https://channels.readthedocs.io/
- **Celery Documentation**: https://docs.celeryproject.org/

---

Your Meroos backend is now ready! 🚀

For detailed information:
- Setup: See SETUP_GUIDE.md
- API: See API_DOCUMENTATION.md
- Structure: See PROJECT_STRUCTURE.md
