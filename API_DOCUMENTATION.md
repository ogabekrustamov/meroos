# Meroos API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Users & Accounts](#users--accounts)
3. [Organizations](#organizations)
4. [News](#news)
5. [Resources](#resources)
6. [Quizzes](#quizzes)
7. [Analytics](#analytics)
8. [WebSocket (Kahoot)](#websocket-kahoot)

---

## Base URL
- Development: `http://localhost:8000/api/`
- Production: `https://your-domain.com/api/`

## Authentication

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "student1",
    "role": "student",
    "full_name": "John Doe"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Logout
```http
POST /api/auth/logout/
Authorization: Bearer {access_token}
```

---

## Users & Accounts

### Get Current User Profile
```http
GET /api/auth/me/
Authorization: Bearer {access_token}
```

### Update Profile
```http
PATCH /api/auth/me/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
```

### Teacher Permissions
```http
GET /api/auth/permissions/
Authorization: Bearer {access_token}
```

**Response (for teachers):**
```json
{
  "can_create_news": true,
  "can_upload_resources": true,
  "can_create_quizzes": true,
  "can_host_kahoot": true,
  "can_create_students": true,
  "can_manage_classes": true,
  "can_view_student_stats": true,
  "allowed_categories": [1, 2, 5]
}
```

---

## Organizations

### List Regions
```http
GET /api/organizations/regions/
```

### Create School (Requires Permission)
```http
POST /api/organizations/schools/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "School #41",
  "school_number": "41",
  "region": 1,
  "address": "123 Main St, Tashkent"
}
```

### List Schools
```http
GET /api/organizations/schools/
GET /api/organizations/schools/?region=1
```

### Create Class (Requires Permission)
```http
POST /api/organizations/classes/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "9-A",
  "grade_level": 9,
  "section": "A",
  "school": 1,
  "academic_year": "2024-2025",
  "max_students": 30
}
```

### Assign Teacher to Class
```http
POST /api/organizations/classes/{id}/assign-teacher/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "teacher_id": 5,
  "subject_id": 2
}
```

### Create Student (Teacher Only)
```http
POST /api/organizations/students/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "student123",
  "password": "initialpass",
  "first_name": "Jane",
  "last_name": "Smith",
  "class_group": 1,
  "student_id": "STU2024001"
}
```

---

## News

### List News Posts
```http
GET /api/news/posts/
GET /api/news/posts/?category=1
GET /api/news/posts/?post_type=announcement
GET /api/news/posts/?is_featured=true
```

**Response:**
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/news/posts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "New Math Course Available",
      "slug": "new-math-course-available",
      "excerpt": "We're excited to announce...",
      "featured_image": "http://localhost:8000/media/news/...",
      "post_type": "news",
      "category": {
        "id": 1,
        "name": "Announcements"
      },
      "author": {
        "id": 2,
        "username": "teacher1",
        "full_name": "John Teacher"
      },
      "published_at": "2024-01-15T10:30:00Z",
      "view_count": 245,
      "is_featured": true,
      "is_pinned": false
    }
  ]
}
```

### Get Single News Post
```http
GET /api/news/posts/{id}/
```

### Create News Post (Teacher with Permission)
```http
POST /api/news/posts/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

title: New Course Launch
excerpt: Short description here
content: Full content here...
post_type: news
category: 1
featured_image: [file]
status: published
```

### Update News Post
```http
PATCH /api/news/posts/{id}/
Authorization: Bearer {access_token}
```

### Delete News Post
```http
DELETE /api/news/posts/{id}/
Authorization: Bearer {access_token}
```

### Add Comment
```http
POST /api/news/posts/{id}/comments/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Great article!",
  "parent": null  // or comment ID for reply
}
```

---

## Resources

### List Categories
```http
GET /api/resources/categories/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Mathematics",
    "slug": "mathematics",
    "icon": "📐",
    "color": "#3B82F6",
    "total_resources": 145
  }
]
```

### List Resources
```http
GET /api/resources/
GET /api/resources/?category=1
GET /api/resources/?resource_type=video
GET /api/resources/?search=algebra
```

**Response:**
```json
{
  "count": 150,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Introduction to Algebra",
      "slug": "introduction-to-algebra",
      "description": "Learn basic algebra concepts",
      "resource_type": "video",
      "category": {
        "id": 1,
        "name": "Mathematics"
      },
      "video_url": "https://youtube.com/watch?v=...",
      "video_duration": 1200,
      "thumbnail": "http://localhost:8000/media/...",
      "uploaded_by": {
        "id": 2,
        "username": "teacher1"
      },
      "view_count": 450,
      "download_count": 89,
      "file_size_mb": 0,
      "allow_download": true,
      "created_at": "2024-01-10T09:00:00Z"
    }
  ]
}
```

### Get Resource
```http
GET /api/resources/{id}/
```

### Upload Resource (Teacher with Permission)
```http
POST /api/resources/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

title: Algebra Basics
description: Complete guide to algebra
resource_type: pdf
category: 1
file: [file]
allow_download: true
```

### View Resource (increments view count)
```http
POST /api/resources/{id}/view/
Authorization: Bearer {access_token}
```

### Download Resource (increments download count)
```http
GET /api/resources/{id}/download/
Authorization: Bearer {access_token}
```

### Bookmark Resource
```http
POST /api/resources/{id}/bookmark/
Authorization: Bearer {access_token}

{
  "notes": "Important for exam"
}
```

### Rate Resource
```http
POST /api/resources/{id}/rate/
Authorization: Bearer {access_token}

{
  "rating": 5,
  "review": "Very helpful resource!"
}
```

---

## Quizzes

### List Quizzes
```http
GET /api/quizzes/
GET /api/quizzes/?category=1
GET /api/quizzes/?quiz_type=standard
GET /api/quizzes/?difficulty=medium
```

**Response:**
```json
{
  "count": 75,
  "results": [
    {
      "id": 1,
      "title": "Algebra Quiz - Chapter 1",
      "slug": "algebra-quiz-chapter-1",
      "description": "Test your knowledge",
      "quiz_type": "standard",
      "category": {
        "id": 1,
        "name": "Mathematics"
      },
      "difficulty": "medium",
      "timing_mode": "per_question",
      "time_per_question": 30,
      "total_questions": 20,
      "total_points": 100,
      "passing_score": 60.0,
      "total_attempts": 245,
      "average_score": 72.5,
      "created_by": {
        "id": 2,
        "username": "teacher1"
      }
    }
  ]
}
```

### Get Quiz Details
```http
GET /api/quizzes/{id}/
```

**Response includes questions for authenticated users:**
```json
{
  "id": 1,
  "title": "Algebra Quiz",
  "questions": [
    {
      "id": 1,
      "question_text": "What is 2 + 2?",
      "image": null,
      "question_type": "single",
      "points": 5,
      "options": [
        {
          "id": 1,
          "option_text": "3",
          "order": 0
        },
        {
          "id": 2,
          "option_text": "4",
          "order": 1
        },
        {
          "id": 3,
          "option_text": "5",
          "order": 2
        }
      ]
    }
  ]
}
```

### Start Quiz Attempt
```http
POST /api/quizzes/{id}/start-attempt/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "attempt_id": "550e8400-e29b-41d4-a716-446655440000",
  "quiz_id": 1,
  "started_at": "2024-01-20T14:30:00Z",
  "status": "in_progress"
}
```

### Submit Answer
```http
POST /api/quizzes/attempts/{attempt_id}/submit-answer/
Authorization: Bearer {access_token}

{
  "question_id": 1,
  "selected_option_ids": [2],
  "time_taken": 15
}
```

**Response:**
```json
{
  "is_correct": true,
  "points_earned": 5,
  "correct_options": [2],
  "explanation": "2 + 2 equals 4"
}
```

### Complete Quiz Attempt
```http
POST /api/quizzes/attempts/{attempt_id}/complete/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "attempt_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "score": 85,
  "max_score": 100,
  "score_percentage": 85.0,
  "passed": true,
  "time_taken": 450,
  "completed_at": "2024-01-20T14:45:00Z"
}
```

### Get My Attempts
```http
GET /api/quizzes/my-attempts/
Authorization: Bearer {access_token}
```

---

## Kahoot-Style Quizzes

### Create Kahoot Room (Teacher with Permission)
```http
POST /api/quizzes/kahoot-rooms/
Authorization: Bearer {access_token}

{
  "quiz_id": 5,
  "max_players": 50,
  "allow_late_join": true
}
```

**Response:**
```json
{
  "id": 1,
  "room_code": "ABC123",
  "quiz": {
    "id": 5,
    "title": "Math Speed Quiz"
  },
  "host": {
    "id": 2,
    "username": "teacher1"
  },
  "status": "waiting",
  "max_players": 50,
  "total_participants": 0,
  "created_at": "2024-01-20T15:00:00Z"
}
```

### Get Room Status
```http
GET /api/quizzes/kahoot-rooms/{room_code}/
```

### Start Room (Host Only)
```http
POST /api/quizzes/kahoot-rooms/{room_code}/start/
Authorization: Bearer {access_token}
```

### End Room (Host Only)
```http
POST /api/quizzes/kahoot-rooms/{room_code}/end/
Authorization: Bearer {access_token}
```

### Get Room Leaderboard
```http
GET /api/quizzes/kahoot-rooms/{room_code}/leaderboard/
```

---

## Analytics

### Get My Statistics (Student)
```http
GET /api/analytics/my-stats/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_quizzes_attempted": 45,
  "total_quizzes_completed": 42,
  "total_quizzes_passed": 38,
  "average_score_percentage": 78.5,
  "highest_score_percentage": 95.0,
  "total_points_earned": 3850,
  "current_streak_days": 7,
  "longest_streak_days": 15,
  "global_rank": 245,
  "class_rank": 3,
  "school_rank": 12,
  "category_breakdown": [
    {
      "category": "Mathematics",
      "quizzes_completed": 15,
      "average_score": 82.5
    }
  ]
}
```

### Get Student Statistics (Teacher with Permission)
```http
GET /api/analytics/student-stats/{student_id}/
Authorization: Bearer {access_token}
```

### Get Class Statistics (Teacher)
```http
GET /api/analytics/class-stats/{class_id}/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "class_group": {
    "id": 1,
    "name": "9-A"
  },
  "total_students": 28,
  "active_students": 25,
  "average_class_score": 75.5,
  "total_quizzes_completed": 450,
  "top_students": [
    {
      "id": 10,
      "username": "student1",
      "full_name": "Jane Doe",
      "average_score": 92.5,
      "rank": 1
    }
  ]
}
```

### Get Global Leaderboard
```http
GET /api/analytics/leaderboard/
GET /api/analytics/leaderboard/?category=1
GET /api/analytics/leaderboard/?type=weekly
```

**Response:**
```json
{
  "leaderboard_type": "global",
  "period": null,
  "rankings": [
    {
      "rank": 1,
      "user": {
        "id": 10,
        "username": "student1",
        "full_name": "Jane Doe"
      },
      "total_points": 5000,
      "average_score": 92.5,
      "quizzes_completed": 50
    }
  ]
}
```

---

## WebSocket (Kahoot)

### Connect to Kahoot Room
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/kahoot/ABC123/');

socket.onopen = function(e) {
  // Join room
  socket.send(JSON.stringify({
    type: 'join',
    user_id: 1,
    username: 'student1'
  }));
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'player_joined':
      console.log(`${data.username} joined! Total: ${data.total_players}`);
      break;
      
    case 'quiz_started':
      console.log('Quiz started!', data.question);
      break;
      
    case 'next_question':
      console.log('Next question:', data.question);
      break;
      
    case 'leaderboard_update':
      console.log('Leaderboard:', data.leaderboard);
      break;
      
    case 'quiz_ended':
      console.log('Quiz ended! Results:', data.results);
      break;
  }
};
```

### Submit Answer via WebSocket
```javascript
socket.send(JSON.stringify({
  type: 'submit_answer',
  user_id: 1,
  answer_ids: [2],
  time_taken: 8
}));
```

### Host Actions
```javascript
// Start quiz (host only)
socket.send(JSON.stringify({
  type: 'start_quiz',
  user_id: 2  // teacher ID
}));

// Next question (host only)
socket.send(JSON.stringify({
  type: 'next_question',
  user_id: 2
}));

// End quiz (host only)
socket.send(JSON.stringify({
  type: 'end_quiz',
  user_id: 2
}));
```

---

## Error Responses

All API endpoints follow consistent error format:

```json
{
  "error": "Error message",
  "detail": "Detailed explanation",
  "code": "error_code"
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour

---

## Pagination
All list endpoints support pagination:

```http
GET /api/resources/?page=2&page_size=50
```

**Response:**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/resources/?page=3",
  "previous": "http://localhost:8000/api/resources/?page=1",
  "results": [...]
}
```

---

## Filtering & Search
Most list endpoints support filtering:

```http
GET /api/quizzes/?category=1&difficulty=easy&search=algebra
```

---

## File Uploads

Maximum file size: 100MB

Supported formats:
- Images: JPG, JPEG, PNG, WEBP
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Videos: MP4, WEBM, OGG, AVI, MOV

---

For complete interactive API documentation, visit:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
