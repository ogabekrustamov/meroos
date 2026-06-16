from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from quizzes.models import Quiz, Question, QuestionOption
from resources.models import Category
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class QuizStartPermissionTest(APITestCase):
    def setUp(self):
        # Create a teacher
        self.teacher = User.objects.create_user(
            username='teacher', 
            password='password123', 
            email='teacher@example.com',
            role='teacher',
            is_staff=True
        )
        
        # Create a student
        self.student = User.objects.create_user(
            username='student', 
            password='password123', 
            email='student@example.com',
            role='student'
        )
        
        # Create category
        self.category = Category.objects.create(
            name='General Knowledge',
            slug='general-knowledge',
        )
        
        # Create a published quiz
        self.quiz = Quiz.objects.create(
            title='Test Quiz',
            description='A test quiz',
            category=self.category,
            created_by=self.teacher,
            is_published=True,
            time_per_question=30
        )
        
        # Add a question
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_text='What is 2+2?',
            question_type='single',
            points=1
        )
        
        # Add options
        QuestionOption.objects.create(question=self.question, option_text='3', is_correct=False)
        QuestionOption.objects.create(question=self.question, option_text='4', is_correct=True)

    def test_student_can_start_quiz(self):
        """Test that a student (non-teacher) can start a quiz attempt"""
        self.client.force_authenticate(user=self.student)
        
        url = reverse('quiz-start-attempt', kwargs={'pk': self.quiz.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('attempt_id', response.data)
        self.assertEqual(response.data['status'], 'in_progress')


class QuizImageURLTest(APITestCase):
    def setUp(self):
        # Create a teacher and student
        self.teacher = User.objects.create_user(username='teacher_img', password='password123', role='teacher')
        self.student = User.objects.create_user(username='student_img', password='password123', role='student')
        
        # Create category
        self.category = Category.objects.create(
            name='Visual Arts',
            slug='visual-arts',
        )
        
        # Create quiz
        self.quiz = Quiz.objects.create(
            title='Art Quiz',
            category=self.category,
            created_by=self.teacher,
            is_published=True
        )
        
        # Create fake image
        image = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
        
        # Create question with image
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_text='Identify this',
            image=image,
            points=1
        )

    def test_question_image_absolute_url(self):
        """Test that question image field returns absolute URL"""
        self.client.force_authenticate(user=self.student)
        
        url = reverse('quiz-detail', kwargs={'pk': self.quiz.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        questions = response.data['questions']
        self.assertEqual(len(questions), 1)
        
        image_url = questions[0]['image']
        print(f"DEBUG: Retrieved Image URL: {image_url}")
        
        self.assertTrue(image_url.startswith('http'), f"Image URL should be absolute, got: {image_url}")
