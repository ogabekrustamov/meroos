# Meroos Educational Platform - Backend

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.0-green.svg" />
  <img src="https://img.shields.io/badge/DRF-3.14-blue.svg" />
  <img src="https://img.shields.io/badge/Python-3.10+-yellow.svg" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-blue.svg" />
  <img src="https://img.shields.io/badge/Redis-6.0+-red.svg" />
  <img src="https://img.shields.io/badge/WebSocket-Channels-purple.svg" />
</p>

A comprehensive, production-ready educational platform backend built with Django REST Framework, featuring real-time quizzes, resource management, analytics, and role-based access control.

---

## ✨ Features

### 🔐 **Authentication & Authorization**
- Custom user model with roles (Superuser, Teacher, Student, Guest)
- JWT-based authentication
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
- Download tracking
- Resource collections
- Bookmarks and ratings
- View and download statistics

### 📝 **Quiz System**
- **Standard Quizzes:**
  - Time per question or total time modes
  - Single choice, multiple choice, true/false
  - Image support for questions and options
  - Randomization options
  - Review before submission
  - Multiple attempts support

- **Kahoot-Style Quizzes:**
  - Real-time multiplayer quiz rooms
  - WebSocket-based communication
  - Live leaderboards
  - Speed-based scoring
  - Host controls (start, next question, end)
  - Dynamic participant management

### 📊 **Analytics & Statistics**
- **Student Statistics:**
  - Quiz performance tracking
  - Global, class, and school rankings
  - Activity streaks (daily, longest)
  - Category-wise performance breakdown
  - Progress over time

- **Teacher Dashboard:**
  - Class performance overview
  - Student progress tracking
  - Quiz statistics
  - Engagement metrics

- **Quiz Analytics:**
  - Completion rates
  - Average scores and time
  - Question difficulty analysis
  - Performance trends

### 🚀 **Technical Features**
- Asynchronous support with Django Channels
- WebSocket for real-time features
- Background task processing with Celery
- Redis caching for performance
- Optimized database queries
- Comprehensive API documentation (Swagger/ReDoc)
- RESTful API design
- Pagination, filtering, and search
- File upload handling
- Rate limiting

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

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 14+ (or SQLite for development)
- Redis 6.0+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd meroos-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
daphne config.asgi:application
```

**For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)**

---

## 📖 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Setup Guide](SETUP_GUIDE.md)** - Comprehensive setup and deployment
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Project Structure](PROJECT_STRUCTURE.md)** - Code organization and architecture

### Interactive API Documentation
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

---

## 🔑 Default Accounts

After running the setup, you can use these test accounts:

**Superuser:**
- Username: `admin`
- Password: (set during `createsuperuser`)

**Teacher (after data population):**
- Username: `teacher1`
- Password: `teacher123`

**Student (after data population):**
- Username: `student1`
- Password: `student123`

---

## 🛠️ Technology Stack

### Core
- **Django 5.0** - Web framework
- **Django REST Framework 3.14** - API framework
- **PostgreSQL 14+** - Database
- **Redis 6.0+** - Caching & message broker

### Async & Real-time
- **Django Channels 4.0** - WebSocket support
- **Daphne** - ASGI server
- **Channels Redis** - Channel layer

### Background Tasks
- **Celery 5.3** - Distributed task queue
- **Redis** - Message broker and result backend

### Authentication
- **djangorestframework-simplejwt** - JWT authentication

### Documentation
- **drf-spectacular** - OpenAPI/Swagger documentation

### Others
- **Pillow** - Image processing
- **django-cors-headers** - CORS handling
- **django-filter** - Advanced filtering
- **python-dotenv** - Environment variables

---

## 📁 Project Structure

```
meroos-backend/
├── config/              # Project configuration
├── accounts/            # User authentication & management
├── organizations/       # Schools, classes, regions
├── news/                # News & announcements
├── resources/           # Educational resources
├── quizzes/             # Quiz system & Kahoot
├── analytics/           # Statistics & reporting
├── media/               # User uploads
├── static/              # Static files
└── logs/                # Application logs
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Get current user

### Organizations
- `GET /api/organizations/regions/` - List regions
- `GET /api/organizations/schools/` - List schools
- `GET /api/organizations/classes/` - List classes

### News
- `GET /api/news/posts/` - List news posts
- `POST /api/news/posts/` - Create news post

### Resources
- `GET /api/resources/` - List resources
- `GET /api/resources/categories/` - List categories
- `POST /api/resources/` - Upload resource

### Quizzes
- `GET /api/quizzes/` - List quizzes
- `POST /api/quizzes/{id}/start-attempt/` - Start quiz
- `POST /api/quizzes/kahoot-rooms/` - Create Kahoot room

### Analytics
- `GET /api/analytics/my-stats/` - Get user statistics
- `GET /api/analytics/leaderboard/` - Get leaderboard

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.**

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure PostgreSQL
- [ ] Set up Redis
- [ ] Configure static files (WhiteNoise)
- [ ] Set up Gunicorn/Daphne
- [ ] Configure Nginx
- [ ] Set up SSL (Let's Encrypt)
- [ ] Configure Celery services
- [ ] Set up logging
- [ ] Enable monitoring

**See [SETUP_GUIDE.md](SETUP_GUIDE.md) for deployment instructions.**

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Project Manager** - Your Name
- **Backend Developer** - Your Name
- **Frontend Developer** - (Separate repository)

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@meroos.com
- Documentation: See docs folder

---

## 🗺️ Roadmap

### Phase 1 (Completed)
- [x] User authentication and authorization
- [x] Organizational structure
- [x] Quiz system
- [x] Resource library
- [x] Real-time Kahoot quizzes
- [x] Analytics and statistics

### Phase 2 (Planned)
- [ ] Live video classes
- [ ] Discussion forums
- [ ] Assignment submission system
- [ ] Certificate generation
- [ ] Mobile app API enhancements
- [ ] AI-powered quiz generation
- [ ] Advanced analytics dashboard

### Phase 3 (Future)
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Parent portal
- [ ] Advanced reporting
- [ ] Gamification features
- [ ] Integration with LMS platforms

---

## ⭐ Acknowledgments

- Django and DRF communities
- All contributors
- Open source libraries used in this project

---

<p align="center">Made with ❤️ for Education</p>
