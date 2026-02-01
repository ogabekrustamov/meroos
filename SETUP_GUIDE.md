# Meroos Backend - Complete Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Running the Application](#running-the-application)
6. [Creating Superuser](#creating-superuser)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### System Requirements
- Python 3.10 or higher
- PostgreSQL 14+ (for production) or SQLite (for development)
- Redis 6.0+
- Node.js 16+ (for frontend, separate repo)

### Installation on Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3.10 python3.10-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl enable redis-server
```

---

## Initial Setup

### 1. Clone Repository and Setup Environment

```bash
# Create project directory
mkdir meroos-backend
cd meroos-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Important .env variables to configure:**
```env
SECRET_KEY=your-super-secret-key-here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database (for production)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=meroos_db
DATABASE_USER=meroos_user
DATABASE_PASSWORD=your_secure_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS (add your frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Generate Secret Key

```python
# Run in Python shell
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Copy the output and paste it as `SECRET_KEY` in your `.env` file.

---

## Database Setup

### For Development (SQLite)
SQLite is already configured by default. Skip to migrations.

### For Production (PostgreSQL)

```bash
# Switch to postgres user
sudo -u postgres psql 
# for windows
# psql -U postgres


# In PostgreSQL shell:
CREATE DATABASE meroos_db;
CREATE USER meroos_user WITH PASSWORD 'your_secure_password';
ALTER ROLE meroos_user SET client_encoding TO 'utf8';
ALTER ROLE meroos_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE meroos_user SET timezone TO 'Asia/Tashkent';
GRANT ALL PRIVILEGES ON DATABASE meroos_db TO meroos_user;

# Grant additional permissions for Django
\c meroos_db
GRANT ALL ON SCHEMA public TO meroos_user;

# Exit
\q
```

### Run Migrations

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

# Create required directories
mkdir -p media/avatars
mkdir -p media/news/images
mkdir -p media/news/attachments
mkdir -p media/resources/videos
mkdir -p media/resources/files
mkdir -p media/resources/thumbnails
mkdir -p media/quizzes/thumbnails
mkdir -p media/quizzes/questions
mkdir -p static
mkdir -p logs
```

---

## Redis Setup

### Verify Redis is Running

```bash
# Check Redis status
redis-cli ping
# Should return: PONG

# Test Redis connection
redis-cli
> SET test "Hello"
> GET test
> exit
```

### Configure Redis for Production

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set these values:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis-server
```

---

## Running the Application

### Development Mode

**Terminal 1 - Django Server:**
```bash
# Activate virtual environment
source venv/bin/activate

# Run development server
python manage.py runserver 0.0.0.0:8000

# Or with Daphne (for WebSocket support)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Terminal 2 - Celery Worker:**
```bash
# Activate virtual environment
source venv/bin/activate

# Start Celery worker
celery -A config worker -l info
```

**Terminal 3 - Celery Beat (for scheduled tasks):**
```bash
# Activate virtual environment
source venv/bin/activate

# Start Celery beat
celery -A config beat -l info
```

### Access Points
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- Swagger Docs: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

---

## Creating Superuser

```bash
# Create superuser
python manage.py createsuperuser

# Follow prompts:
# Username: admin
# Password: (enter secure password)
```

### Initial Data Setup via Admin

1. **Login to Admin Panel:**
   - Go to http://localhost:8000/admin/
   - Login with superuser credentials

2. **Create Initial Data:**
   - Create Regions (e.g., Tashkent, Samarkand)
   - Create Categories (Math, Physics, History, etc.)
   - Create News Categories

3. **Create Sample Teacher:**
   ```python
   # In Django shell
   python manage.py shell
   
   from accounts.models import User, TeacherPermission
   
   # Create teacher
   teacher = User.objects.create_user(
       username='teacher1',
       password='teacher123',
       role='teacher',
       first_name='John',
       last_name='Doe'
   )
   
   # Create permissions
   perms = TeacherPermission.objects.create(
       teacher=teacher,
       can_create_news=True,
       can_upload_resources=True,
       can_create_quizzes=True,
       can_host_kahoot=True,
       can_create_students=True,
       can_manage_classes=True,
       can_view_student_stats=True
   )
   ```

---

## Testing

### Run Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test quizzes

# With coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### API Testing

```bash
# Install httpie or use curl
pip install httpie

# Test login endpoint
http POST http://localhost:8000/api/auth/login/ username="admin" password="your_password"

# Test with token
http GET http://localhost:8000/api/quizzes/ "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Production Deployment

### 1. Update Settings for Production

```bash
# In .env file:
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
SECRET_KEY=your-very-secure-production-key

# Use PostgreSQL
DATABASE_ENGINE=django.db.backends.postgresql
# ... other database settings
```

### 2. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 3. Setup Gunicorn

```bash
# Install gunicorn (already in requirements.txt)
pip install gunicorn

# Test gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Create systemd service
sudo nano /etc/systemd/system/meroos.service
```

**meroos.service:**
```ini
[Unit]
Description=Meroos Django Application
After=network.target

[Service]
Type=notify
User=your_user
Group=www-data
WorkingDirectory=/path/to/meroos-backend
Environment="PATH=/path/to/meroos-backend/venv/bin"
ExecStart=/path/to/meroos-backend/venv/bin/gunicorn \
          --workers 4 \
          --bind unix:/path/to/meroos-backend/meroos.sock \
          --timeout 60 \
          --access-logfile /path/to/meroos-backend/logs/access.log \
          --error-logfile /path/to/meroos-backend/logs/error.log \
          config.wsgi:application

[Install]
WantedBy=multi-user.target
```

### 4. Setup Daphne for WebSocket

```bash
# Create daphne service
sudo nano /etc/systemd/system/meroos-daphne.service
```

**meroos-daphne.service:**
```ini
[Unit]
Description=Meroos Daphne (ASGI) Server
After=network.target

[Service]
Type=simple
User=your_user
Group=www-data
WorkingDirectory=/path/to/meroos-backend
Environment="PATH=/path/to/meroos-backend/venv/bin"
ExecStart=/path/to/meroos-backend/venv/bin/daphne \
          -u /path/to/meroos-backend/daphne.sock \
          config.asgi:application

[Install]
WantedBy=multi-user.target
```

### 5. Setup Celery Services

**Celery Worker:**
```bash
sudo nano /etc/systemd/system/meroos-celery.service
```

```ini
[Unit]
Description=Meroos Celery Worker
After=network.target

[Service]
Type=forking
User=your_user
Group=www-data
WorkingDirectory=/path/to/meroos-backend
Environment="PATH=/path/to/meroos-backend/venv/bin"
ExecStart=/path/to/meroos-backend/venv/bin/celery -A config worker \
          --loglevel=info \
          --logfile=/path/to/meroos-backend/logs/celery.log

[Install]
WantedBy=multi-user.target
```

**Celery Beat:**
```bash
sudo nano /etc/systemd/system/meroos-celerybeat.service
```

```ini
[Unit]
Description=Meroos Celery Beat
After=network.target

[Service]
Type=simple
User=your_user
Group=www-data
WorkingDirectory=/path/to/meroos-backend
Environment="PATH=/path/to/meroos-backend/venv/bin"
ExecStart=/path/to/meroos-backend/venv/bin/celery -A config beat \
          --loglevel=info \
          --logfile=/path/to/meroos-backend/logs/celerybeat.log

[Install]
WantedBy=multi-user.target
```

### 6. Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/meroos
```

**nginx configuration:**
```nginx
upstream meroos_django {
    server unix:/path/to/meroos-backend/meroos.sock;
}

upstream meroos_daphne {
    server unix:/path/to/meroos-backend/daphne.sock;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://meroos_django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws/ {
        proxy_pass http://meroos_daphne;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /path/to/meroos-backend/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/meroos-backend/media/;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/meroos /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 7. SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

### 8. Start All Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start and enable services
sudo systemctl start meroos
sudo systemctl start meroos-daphne
sudo systemctl start meroos-celery
sudo systemctl start meroos-celerybeat

sudo systemctl enable meroos
sudo systemctl enable meroos-daphne
sudo systemctl enable meroos-celery
sudo systemctl enable meroos-celerybeat

# Check status
sudo systemctl status meroos
sudo systemctl status meroos-daphne
sudo systemctl status meroos-celery
```

---

## Monitoring and Maintenance

### View Logs

```bash
# Django logs
tail -f logs/meroos.log

# Celery logs
tail -f logs/celery.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Systemd service logs
sudo journalctl -u meroos -f
sudo journalctl -u meroos-celery -f
```

### Database Backup

```bash
# PostgreSQL backup
pg_dump -U meroos_user meroos_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U meroos_user meroos_db < backup_20240131.sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Activate venv
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart meroos
sudo systemctl restart meroos-daphne
sudo systemctl restart meroos-celery
```

---

## Troubleshooting

### Issue: Database connection refused
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Check credentials in .env
```

### Issue: Redis connection refused
```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

### Issue: Static files not loading
```bash
# Collect static files
python manage.py collectstatic

# Check nginx configuration
sudo nginx -t

# Check file permissions
chmod -R 755 staticfiles/
```

### Issue: WebSocket not working
```bash
# Check Daphne is running
sudo systemctl status meroos-daphne

# Check nginx WebSocket proxy configuration
# Ensure Upgrade and Connection headers are set
```

---

## Next Steps

1. **Frontend Integration**: Set up your React frontend repository
2. **API Testing**: Use the Swagger docs to test all endpoints
3. **Load Testing**: Use tools like Apache Bench or Locust
4. **Monitoring**: Set up monitoring (Sentry, New Relic, etc.)
5. **Backups**: Automate database and media backups
6. **CDN**: Set up CDN for static/media files (optional)

Your Meroos backend is now fully set up and ready for development or production use!
