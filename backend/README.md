# Meroos Educational Platform - Backend

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.0-092E20.svg?logo=django" />
  <img src="https://img.shields.io/badge/DRF-3.14-A30000.svg" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1.svg?logo=postgresql" />
  <img src="https://img.shields.io/badge/Redis-6.0+-DC382D.svg?logo=redis" />
  <img src="https://img.shields.io/badge/WebSocket-Channels-764ABC.svg" />
</p>

A comprehensive, production-ready educational platform backend built with Django REST Framework, featuring real-time quizzes, resource management, analytics, and role-based access control.

---

## ✨ Features

### 🔐 **Authentication & Authorization**
- Custom user model with roles (Superuser, Teacher, Student, Guest)
- JWT-based authentication with token refresh
- Granular permission system for teachers
- Role-based access control (RBAC)

### 🏫 **Organizational Structure**
- Hierarchical organization: Region → School → Class
- Teacher-class assignments with subject mapping
- Student enrollment and management
- Flexible class organization

### 📰 **News & Announcements**
- Blog-style news posts with rich content
- Categories and tags
- Comments system with nested replies
- File attachments support
- Featured and pinned posts

### 📚 **Resource Library**
- Multiple resource types: Videos, PDFs, Links, Documents
- Category-based organization
- Support for YouTube/Vimeo embeds
- Download tracking and statistics
- Bookmarks and ratings

### 📝 **Quiz System**

**Standard Quizzes:**
- Time per question or total time modes
- Single choice, multiple choice, true/false
- Image support for questions and options
- Randomization options
- Multiple attempts support

**Kahoot-Style Quizzes:**
- Real-time multiplayer quiz rooms
- WebSocket-based communication
- Live leaderboards
- Speed-based scoring
- Host controls (start, next question, end)

### 📊 **Analytics & Statistics**
- Quiz performance tracking
- Global, class, and school rankings
- Activity streaks (daily, longest)
- Category-wise performance breakdown
- Teacher dashboard with class insights

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│                 │      │              │      │             │
│  React Frontend ├─────►│  Django REST ├─────►│ PostgreSQL  │
│                 │ HTTP │    API       │      │  Database   │
└─────────────────┘      └──────┬───────┘      └─────────────┘
                                │
                         ┌──────▼───────┐
                         │              │
                         │    Redis     │
                         │  (Cache +    │
                         │  Channels)   │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │              │
                         │    Celery    │
                         │  (Background │
                         │    Tasks)    │
                         └──────────────┘
```

---

## 📁 Project Structure

```
meroos-backend/
├── config/              # Project settings & configuration
│   ├── settings.py      # Django settings
│   ├── urls.py          # Root URL configuration
│   ├── asgi.py          # ASGI config (WebSocket support)
│   └── wsgi.py          # WSGI config
├── accounts/            # User authentication & management
├── organizations/       # Schools, classes, regions
├── news/                # News posts & announcements
├── resources/           # Educational resources
├── quizzes/             # Quiz system & Kahoot
├── analytics/           # Statistics & reporting
├── media/               # User uploads
├── static/              # Static files
└── logs/                # Application logs
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 14+ (or SQLite for development)
- Redis 6.0+ (for WebSocket & caching)

### Installation

```bash
# Clone and navigate to backend
cd meroos-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
# Or with WebSocket support:
daphne config.asgi:application
```

The API will be available at `http://localhost:8000`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=meroos
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login (returns JWT) |
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user profile |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations/regions/` | List all regions |
| GET | `/api/organizations/schools/` | List all schools |
| GET | `/api/organizations/classes/` | List all classes |

### News
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news/posts/` | List news posts |
| POST | `/api/news/posts/` | Create news post |
| GET | `/api/news/categories/` | List categories |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources/` | List resources |
| POST | `/api/resources/` | Upload resource |
| GET | `/api/resources/categories/` | List categories |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes/` | List quizzes |
| POST | `/api/quizzes/` | Create quiz |
| POST | `/api/quizzes/{id}/start-attempt/` | Start quiz attempt |
| POST | `/api/quizzes/kahoot-rooms/` | Create Kahoot room |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/my-stats/` | Get user statistics |
| GET | `/api/analytics/leaderboard/` | Get leaderboard |
| GET | `/api/analytics/class-stats/` | Get class statistics |

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/

---

## 🔑 Default Test Accounts

After setup, you can use these test accounts:

| Role | Username | Password |
|------|----------|----------|
| Superuser | `admin` | (set during createsuperuser) |
| Teacher | `teacher1` | `teacher123` |
| Student | `student1` | `student123` |

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Django 5.0 |
| **API** | Django REST Framework 3.14 |
| **Database** | PostgreSQL 14+ |
| **Cache** | Redis 6.0+ |
| **WebSocket** | Django Channels 4.0 |
| **Server** | Daphne (ASGI) |
| **Tasks** | Celery 5.3 |
| **Auth** | djangorestframework-simplejwt |
| **Docs** | drf-spectacular |

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test quizzes

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for caching and channels
- [ ] Configure static files (WhiteNoise or CDN)
- [ ] Set up Gunicorn/Daphne
- [ ] Configure Nginx as reverse proxy
- [ ] Set up SSL (Let's Encrypt)
- [ ] Configure Celery workers
- [ ] Enable logging and monitoring

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

---

## 📖 Additional Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Setup Guide](SETUP_GUIDE.md)** - Comprehensive setup and deployment
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Project Structure](PROJECT_STRUCTURE.md)** - Code organization details

---

## 🗺️ Roadmap

### ✅ Phase 1 (Completed)
- [x] User authentication and authorization
- [x] Organizational structure
- [x] Quiz system with multiple question types
- [x] Resource library
- [x] Real-time Kahoot-style quizzes
- [x] Analytics and statistics

### 🚧 Phase 2 (Planned)
- [ ] Live video classes
- [ ] Discussion forums
- [ ] Assignment submission system
- [ ] Certificate generation
- [ ] AI-powered quiz generation

### 🔮 Phase 3 (Future)
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Parent portal
- [ ] LMS platform integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

- **Issues**: Create an issue on GitHub
- **Email**: support@meroos.com
- **Docs**: See documentation files

---

## 🔗 Related

- [Frontend Repository](../meroos-frontend/README.md) - React frontend application

---

<p align="center">Made with ❤️ for Education</p>
