from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from quizzes.models import Quiz, Question, QuestionOption, QuizAttempt, QuizAnswer
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
        self.assertTrue(image_url.startswith('http'), f"Image URL should be absolute, got: {image_url}")


class QuizScoringTest(APITestCase):
    """Model-level coverage of answer correctness and attempt scoring."""

    def setUp(self):
        self.teacher = User.objects.create_user(
            username='scorer_teacher', password='pw12345', role='teacher',
        )
        self.student = User.objects.create_user(
            username='scorer_student', password='pw12345', role='student',
        )
        self.category = Category.objects.create(name='Scoring Cat', slug='scoring-cat')
        self.quiz = Quiz.objects.create(
            title='Scoring Quiz', description='x', category=self.category,
            created_by=self.teacher, is_published=True, passing_score=50, time_per_question=30,
        )
        self.q1 = Question.objects.create(
            quiz=self.quiz, question_text='2+2?', question_type='single', points=10, order=1,
        )
        self.q1_correct = QuestionOption.objects.create(question=self.q1, option_text='4', is_correct=True, order=1)
        self.q1_wrong = QuestionOption.objects.create(question=self.q1, option_text='5', is_correct=False, order=2)
        self.q2 = Question.objects.create(
            quiz=self.quiz, question_text='3+3?', question_type='single', points=10, order=2,
        )
        self.q2_correct = QuestionOption.objects.create(question=self.q2, option_text='6', is_correct=True, order=1)
        self.q2_wrong = QuestionOption.objects.create(question=self.q2, option_text='7', is_correct=False, order=2)

    def _answer(self, attempt, question, option):
        answer = QuizAnswer.objects.create(attempt=attempt, question=question)
        answer.selected_options.set([option])
        answer.check_correctness()
        return answer

    def test_total_points_sums_question_points(self):
        self.assertEqual(self.quiz.total_points, 20)

    def test_correct_answer_awards_points(self):
        attempt = QuizAttempt.objects.create(quiz=self.quiz, user=self.student)
        answer = self._answer(attempt, self.q1, self.q1_correct)
        self.assertTrue(answer.is_correct)
        self.assertEqual(answer.points_earned, 10)

    def test_wrong_answer_awards_zero(self):
        attempt = QuizAttempt.objects.create(quiz=self.quiz, user=self.student)
        answer = self._answer(attempt, self.q1, self.q1_wrong)
        self.assertFalse(answer.is_correct)
        self.assertEqual(answer.points_earned, 0)

    def test_complete_computes_score_and_marks_pass(self):
        attempt = QuizAttempt.objects.create(quiz=self.quiz, user=self.student)
        self._answer(attempt, self.q1, self.q1_correct)  # +10
        self._answer(attempt, self.q2, self.q2_wrong)    # +0
        attempt.complete()
        attempt.refresh_from_db()
        self.assertEqual(attempt.score, 10)
        self.assertEqual(attempt.max_score, 20)
        self.assertEqual(attempt.score_percentage, 50.0)
        self.assertTrue(attempt.passed)  # 50% >= passing_score 50

    def test_failing_attempt_is_not_passed(self):
        attempt = QuizAttempt.objects.create(quiz=self.quiz, user=self.student)
        self._answer(attempt, self.q1, self.q1_wrong)
        self._answer(attempt, self.q2, self.q2_wrong)
        attempt.complete()
        attempt.refresh_from_db()
        self.assertEqual(attempt.score, 0)
        self.assertFalse(attempt.passed)
