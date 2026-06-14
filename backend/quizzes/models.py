"""
Quizzes models - Standard and Kahoot-style quiz system
"""

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
import uuid


class Quiz(models.Model):
    """Quiz/Test"""
    
    QUIZ_TYPE_CHOICES = [
        ('standard', 'Standard Quiz'),
        ('kahoot', 'Kahoot-Style'),
    ]
    
    TIMING_MODE_CHOICES = [
        ('per_question', 'Time per Question'),
        ('total', 'Total Time for Quiz'),
        ('none', 'No Time Limit'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('mixed', 'Mixed'),
    ]
    
    # Basic info
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=350, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    # Type
    quiz_type = models.CharField(
        max_length=20,
        choices=QUIZ_TYPE_CHOICES,
        default='standard'
    )
    
    # Category
    category = models.ForeignKey(
        'resources.Category',
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    
    # Difficulty
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='medium'
    )
    
    # Timing
    timing_mode = models.CharField(
        max_length=20,
        choices=TIMING_MODE_CHOICES,
        default='per_question'
    )
    time_per_question = models.IntegerField(
        default=30,
        validators=[MinValueValidator(5)],
        help_text="Seconds per question"
    )
    total_time = models.IntegerField(
        default=900,
        validators=[MinValueValidator(60)],
        help_text="Total seconds for entire quiz"
    )
    
    # Scoring
    passing_score = models.FloatField(
        default=60.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum percentage to pass"
    )
    
    # Question settings
    show_correct_answers = models.BooleanField(
        default=True,
        help_text="Show correct answers after completion"
    )
    randomize_questions = models.BooleanField(
        default=False,
        help_text="Randomize question order"
    )
    randomize_options = models.BooleanField(
        default=False,
        help_text="Randomize answer options"
    )
    allow_review = models.BooleanField(
        default=True,
        help_text="Allow users to review answers before submitting"
    )
    
    # Attempts
    max_attempts = models.IntegerField(
        default=0,
        help_text="0 = unlimited attempts"
    )
    
    # Access control
    is_published = models.BooleanField(default=False, db_index=True)
    requires_login = models.BooleanField(default=False)
    
    # Creator
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_quizzes'
    )
    
    # Metadata
    thumbnail = models.ImageField(
        upload_to='quizzes/thumbnails/%Y/%m/',
        blank=True,
        null=True
    )
    tags = models.JSONField(default=list, blank=True)
    
    # Stats
    total_attempts = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['quiz_type', 'is_published']),
            models.Index(fields=['created_by', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_quiz_type_display()})"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def total_questions(self):
        return self.questions.count()
    
    @property
    def total_points(self):
        return self.questions.aggregate(
            total=models.Sum('points')
        )['total'] or 0
    
    def update_statistics(self):
        """Update quiz statistics from attempts"""
        attempts = self.attempts.filter(status='completed')
        
        self.total_attempts = attempts.count()
        
        if self.total_attempts > 0:
            avg = attempts.aggregate(
                avg=models.Avg('score_percentage')
            )['avg']
            self.average_score = round(avg, 2) if avg else 0.0
        
        self.save(update_fields=['total_attempts', 'average_score'])


class Question(models.Model):
    """Quiz question"""
    
    QUESTION_TYPE_CHOICES = [
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
        ('true_false', 'True/False'),
    ]
    
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    
    # Content
    question_text = models.TextField()
    explanation = models.TextField(
        blank=True,
        help_text="Explanation shown after answering"
    )
    
    # Image support
    image = models.ImageField(
        upload_to='quizzes/questions/%Y/%m/',
        blank=True,
        null=True
    )
    
    # Type
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        default='single'
    )
    
    # Points
    points = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    
    # Order
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quiz_questions'
        ordering = ['quiz', 'order']
        indexes = [
            models.Index(fields=['quiz', 'order']),
        ]
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class QuestionOption(models.Model):
    """Answer options for questions"""
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    
    option_text = models.CharField(max_length=500)
    
    # Image support for options
    image = models.ImageField(
        upload_to='quizzes/options/%Y/%m/',
        blank=True,
        null=True
    )
    
    is_correct = models.BooleanField(default=False)
    
    # Order
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quiz_question_options'
        ordering = ['question', 'order']
        indexes = [
            models.Index(fields=['question', 'order']),
        ]
    
    def __str__(self):
        correct = "✓" if self.is_correct else "✗"
        return f"{correct} {self.option_text[:30]}"


class QuizAttempt(models.Model):
    """Student's quiz attempt"""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    # Unique ID for this attempt
    attempt_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='quiz_attempts'
    )
    
    # Attempt number for this user on this quiz
    attempt_number = models.IntegerField(default=1)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='in_progress'
    )
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(
        default=0,
        help_text="Time taken in seconds"
    )
    
    # Scoring
    score = models.IntegerField(default=0, help_text="Total points earned")
    max_score = models.IntegerField(default=0, help_text="Maximum possible points")
    score_percentage = models.FloatField(default=0.0)
    passed = models.BooleanField(default=False)
    
    # Kahoot room (if applicable)
    kahoot_room = models.ForeignKey(
        'KahootRoom',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attempts'
    )
    
    # For Kahoot: final rank in room
    final_rank = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['quiz', '-started_at']),
            models.Index(fields=['status', '-started_at']),
            models.Index(fields=['kahoot_room', '-score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} (Attempt #{self.attempt_number})"
    
    def calculate_score(self):
        """Calculate total score from answers"""
        correct_answers = self.answers.filter(is_correct=True)
        self.score = sum(answer.points_earned for answer in correct_answers)
        
        # Get max possible score
        self.max_score = self.quiz.total_points
        
        # Calculate percentage
        if self.max_score > 0:
            self.score_percentage = round((self.score / self.max_score) * 100, 2)
        else:
            self.score_percentage = 0.0
        
        # Check if passed
        self.passed = self.score_percentage >= self.quiz.passing_score
        
        self.save(update_fields=['score', 'max_score', 'score_percentage', 'passed'])
    
    def complete(self):
        """Mark attempt as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        
        # Calculate time taken
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.time_taken = int(delta.total_seconds())
        
        self.calculate_score()


class QuizAnswer(models.Model):
    """User's answer to a question"""
    
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='user_answers'
    )
    
    # Selected option(s)
    selected_options = models.ManyToManyField(
        QuestionOption,
        related_name='user_selections'
    )
    
    # Correctness
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    
    # Timing (for Kahoot - speed matters)
    time_taken = models.IntegerField(
        default=0,
        help_text="Time taken to answer in seconds"
    )
    
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quiz_answers'
        unique_together = [['attempt', 'question']]
        ordering = ['attempt', 'question__order']
        indexes = [
            models.Index(fields=['attempt', 'question']),
        ]
    
    def __str__(self):
        return f"{self.attempt.user.username}'s answer to Q{self.question.order}"
    
    def check_correctness(self):
        """Check if answer is correct and award points"""
        question = self.question
        selected = list(self.selected_options.values_list('id', flat=True))
        correct = list(question.options.filter(is_correct=True).values_list('id', flat=True))
        
        if question.question_type == 'single':
            # Single choice: must select exactly one correct option
            self.is_correct = len(selected) == 1 and selected[0] in correct
        
        elif question.question_type == 'multiple':
            # Multiple choice: must select all correct and no incorrect
            self.is_correct = set(selected) == set(correct)
        
        elif question.question_type == 'true_false':
            # True/False: must select the correct option
            self.is_correct = len(selected) == 1 and selected[0] in correct
        
        # Award points if correct
        if self.is_correct:
            self.points_earned = question.points
        else:
            self.points_earned = 0
        
        self.save(update_fields=['is_correct', 'points_earned'])


class KahootRoom(models.Model):
    """Real-time Kahoot-style quiz room"""
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Players'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Unique room code
    room_code = models.CharField(max_length=8, unique=True, db_index=True)
    
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        limit_choices_to={'quiz_type': 'kahoot'},
        related_name='kahoot_rooms'
    )
    
    # Host (teacher)
    host = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        limit_choices_to={'role__in': ['teacher', 'superuser']},
        related_name='hosted_rooms'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='waiting'
    )
    
    # Current question index (0-based)
    current_question_index = models.IntegerField(default=0)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Settings
    max_players = models.IntegerField(default=50)
    allow_late_join = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'kahoot_rooms'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room_code']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['host', '-created_at']),
        ]
    
    def __str__(self):
        return f"Room {self.room_code} - {self.quiz.title}"
    
    @property
    def total_participants(self):
        return self.attempts.count()
    
    @property
    def active_participants(self):
        return self.attempts.filter(status='in_progress').count()
    
    def generate_room_code(self):
        """Generate unique 6-digit room code"""
        import random
        import string
        
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not KahootRoom.objects.filter(room_code=code).exists():
                return code
    
    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = self.generate_room_code()
        super().save(*args, **kwargs)


class KahootLeaderboard(models.Model):
    """Cached leaderboard for Kahoot rooms"""
    
    room = models.ForeignKey(
        KahootRoom,
        on_delete=models.CASCADE,
        related_name='leaderboard_entries'
    )
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='kahoot_rankings'
    )
    
    # Score and rank
    total_score = models.IntegerField(default=0)
    rank = models.IntegerField(default=0)
    
    # Stats
    correct_answers = models.IntegerField(default=0)
    average_time = models.FloatField(default=0.0, help_text="Average time per question")
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kahoot_leaderboard'
        unique_together = [['room', 'user']]
        ordering = ['room', 'rank']
        indexes = [
            models.Index(fields=['room', 'rank']),
        ]

    def __str__(self):
        return f"#{self.rank} {self.user.username} in {self.room.room_code}"

    @classmethod
    def recompute_ranks(cls, room):
        """Persist rank for every entry in a room with a single bulk write.

        Ordered by score (desc) then average answer time (asc). Called when a
        leaderboard needs durable ranks (quiz end / HTTP fallback) rather than
        on every answer submission.
        """
        entries = list(
            cls.objects.filter(room=room).order_by('-total_score', 'average_time')
        )
        for position, entry in enumerate(entries, start=1):
            entry.rank = position
        cls.objects.bulk_update(entries, ['rank'])
        return entries