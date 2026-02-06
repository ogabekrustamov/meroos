"""
Analytics models - Comprehensive statistics and reporting
"""

from django.db import models
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Q


class UserStatistics(models.Model):
    """Aggregated statistics for users (cached for performance)"""
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='statistics'
    )
    
    # Quiz stats
    total_quizzes_attempted = models.IntegerField(default=0)
    total_quizzes_completed = models.IntegerField(default=0)
    total_quizzes_passed = models.IntegerField(default=0)
    
    # Scoring
    average_score_percentage = models.FloatField(default=0.0)
    highest_score_percentage = models.FloatField(default=0.0)
    total_points_earned = models.IntegerField(default=0)
    
    # Time
    total_time_spent = models.IntegerField(default=0, help_text="Total seconds spent on quizzes")
    average_quiz_time = models.IntegerField(default=0, help_text="Average seconds per quiz")
    
    # Engagement
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    # Ranking
    global_rank = models.IntegerField(null=True, blank=True)
    class_rank = models.IntegerField(null=True, blank=True)
    school_rank = models.IntegerField(null=True, blank=True)
    
    # Resource engagement
    total_resources_viewed = models.IntegerField(default=0)
    total_resources_downloaded = models.IntegerField(default=0)
    
    # Last updated
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_statistics'
        verbose_name = 'User Statistics'
        verbose_name_plural = 'User Statistics'
        indexes = [
            models.Index(fields=['-average_score_percentage']),
            models.Index(fields=['-total_points_earned']),
            models.Index(fields=['global_rank']),
        ]
    
    def __str__(self):
        return f"Stats for {self.user.username}"
    
    def update_from_attempts(self):
        """Recalculate statistics from quiz attempts"""
        from quizzes.models import QuizAttempt
        
        attempts = QuizAttempt.objects.filter(user=self.user)
        completed = attempts.filter(status='completed')
        
        # Basic counts
        self.total_quizzes_attempted = attempts.count()
        self.total_quizzes_completed = completed.count()
        self.total_quizzes_passed = completed.filter(passed=True).count()
        
        if completed.exists():
            # Averages
            stats = completed.aggregate(
                avg_score=Avg('score_percentage'),
                max_score=models.Max('score_percentage'),
                total_points=Sum('score'),
                total_time=Sum('time_taken'),
            )
            
            self.average_score_percentage = round(stats['avg_score'] or 0, 2)
            self.highest_score_percentage = round(stats['max_score'] or 0, 2)
            self.total_points_earned = stats['total_points'] or 0
            self.total_time_spent = stats['total_time'] or 0
            
            if self.total_quizzes_completed > 0:
                self.average_quiz_time = self.total_time_spent // self.total_quizzes_completed
        
        self.save()
    
    def update_streak(self):
        """Update activity streak"""
        today = timezone.now().date()
        
        if self.last_activity_date == today:
            return  # Already updated today
        
        if self.last_activity_date == today - timezone.timedelta(days=1):
            # Continue streak
            self.current_streak_days += 1
        else:
            # Reset streak
            self.current_streak_days = 1
        
        if self.current_streak_days > self.longest_streak_days:
            self.longest_streak_days = self.current_streak_days
        
        self.last_activity_date = today
        self.save(update_fields=[
            'current_streak_days',
            'longest_streak_days',
            'last_activity_date'
        ])


class CategoryStatistics(models.Model):
    """User statistics per category"""
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='category_statistics'
    )
    
    category = models.ForeignKey(
        'resources.Category',
        on_delete=models.CASCADE,
        related_name='user_statistics'
    )
    
    # Quiz performance in this category
    quizzes_attempted = models.IntegerField(default=0)
    quizzes_completed = models.IntegerField(default=0)
    quizzes_passed = models.IntegerField(default=0)
    
    average_score = models.FloatField(default=0.0)
    highest_score = models.FloatField(default=0.0)
    
    total_time_spent = models.IntegerField(default=0)
    
    # Resources viewed in this category
    resources_viewed = models.IntegerField(default=0)
    
    last_activity = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'category_statistics'
        unique_together = [['user', 'category']]
        verbose_name = 'Category Statistics'
        verbose_name_plural = 'Category Statistics'
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['category', '-average_score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.category.name} stats"
    
    def update_from_attempts(self):
        """Recalculate from quiz attempts in this category"""
        from quizzes.models import QuizAttempt
        
        attempts = QuizAttempt.objects.filter(
            user=self.user,
            quiz__category=self.category
        )
        completed = attempts.filter(status='completed')
        
        self.quizzes_attempted = attempts.count()
        self.quizzes_completed = completed.count()
        self.quizzes_passed = completed.filter(passed=True).count()
        
        if completed.exists():
            stats = completed.aggregate(
                avg=Avg('score_percentage'),
                max=models.Max('score_percentage'),
                total_time=Sum('time_taken'),
            )
            
            self.average_score = round(stats['avg'] or 0, 2)
            self.highest_score = round(stats['max'] or 0, 2)
            self.total_time_spent = stats['total_time'] or 0
            self.last_activity = completed.order_by('-completed_at').first().completed_at
        
        self.save()


class ClassStatistics(models.Model):
    """Aggregated statistics for a class"""
    
    class_group = models.OneToOneField(
        'organizations.ClassGroup',
        on_delete=models.CASCADE,
        related_name='statistics'
    )
    
    # Enrollment
    total_students = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    
    # Quiz performance
    total_quizzes_attempted = models.IntegerField(default=0)
    total_quizzes_completed = models.IntegerField(default=0)
    average_class_score = models.FloatField(default=0.0)
    
    # Engagement
    average_streak = models.FloatField(default=0.0)
    total_active_days = models.IntegerField(default=0)
    
    # Top performers
    top_student = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    top_student_score = models.FloatField(default=0.0)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_statistics'
        verbose_name = 'Class Statistics'
        verbose_name_plural = 'Class Statistics'
    
    def __str__(self):
        return f"Stats for {self.class_group.name}"
    
    def update_statistics(self):
        """Recalculate class statistics"""
        from accounts.models import StudentProfile
        from quizzes.models import QuizAttempt
        
        # Get all students in this class
        students = StudentProfile.objects.filter(
            class_group=self.class_group,
            user__is_active=True
        )
        
        self.total_students = students.count()
        
        # Get student user IDs
        student_user_ids = students.values_list('user_id', flat=True)
        
        # Active students (with activity in last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        self.active_students = StudentProfile.objects.filter(
            class_group=self.class_group,
            user__is_active=True,
            last_activity_date__gte=thirty_days_ago
        ).count()
        
        # Quiz statistics
        attempts = QuizAttempt.objects.filter(user_id__in=student_user_ids)
        completed = attempts.filter(status='completed')
        
        self.total_quizzes_attempted = attempts.count()
        self.total_quizzes_completed = completed.count()
        
        if completed.exists():
            avg = completed.aggregate(avg=Avg('score_percentage'))['avg']
            self.average_class_score = round(avg or 0, 2)
        
        # Engagement
        if students.exists():
            avg_streak = students.aggregate(avg=Avg('current_streak'))['avg']
            self.average_streak = round(avg_streak or 0, 2)
        
        # Find top student
        if student_user_ids:
            top = UserStatistics.objects.filter(
                user_id__in=student_user_ids
            ).order_by('-average_score_percentage').first()
            
            if top:
                self.top_student = top.user
                self.top_student_score = top.average_score_percentage
        
        self.save()


class QuizStatistics(models.Model):
    """Detailed statistics for a quiz"""
    
    quiz = models.OneToOneField(
        'quizzes.Quiz',
        on_delete=models.CASCADE,
        related_name='detailed_statistics'
    )
    
    # Attempt stats
    total_attempts = models.IntegerField(default=0)
    total_completions = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)
    
    # Scoring
    average_score = models.FloatField(default=0.0)
    median_score = models.FloatField(default=0.0)
    highest_score = models.FloatField(default=0.0)
    lowest_score = models.FloatField(default=0.0)
    
    # Passing
    pass_rate = models.FloatField(default=0.0)
    total_passed = models.IntegerField(default=0)
    
    # Timing
    average_time = models.IntegerField(default=0, help_text="Average seconds to complete")
    fastest_time = models.IntegerField(default=0)
    slowest_time = models.IntegerField(default=0)
    
    # Question difficulty (based on correct answer rate)
    easiest_question = models.ForeignKey(
        'quizzes.Question',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    hardest_question = models.ForeignKey(
        'quizzes.Question',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quiz_statistics'
        verbose_name = 'Quiz Statistics'
        verbose_name_plural = 'Quiz Statistics'
    
    def __str__(self):
        return f"Stats for {self.quiz.title}"
    
    def update_statistics(self):
        """Recalculate quiz statistics"""
        from quizzes.models import QuizAttempt, QuizAnswer
        
        attempts = QuizAttempt.objects.filter(quiz=self.quiz)
        completed = attempts.filter(status='completed')
        
        self.total_attempts = attempts.count()
        self.total_completions = completed.count()
        
        if self.total_attempts > 0:
            self.completion_rate = round(
                (self.total_completions / self.total_attempts) * 100, 2
            )
        
        if completed.exists():
            scores = list(completed.values_list('score_percentage', flat=True))
            
            self.average_score = round(sum(scores) / len(scores), 2)
            self.highest_score = max(scores)
            self.lowest_score = min(scores)
            
            # Median
            scores_sorted = sorted(scores)
            mid = len(scores_sorted) // 2
            if len(scores_sorted) % 2 == 0:
                self.median_score = (scores_sorted[mid-1] + scores_sorted[mid]) / 2
            else:
                self.median_score = scores_sorted[mid]
            
            # Pass rate
            self.total_passed = completed.filter(passed=True).count()
            self.pass_rate = round((self.total_passed / self.total_completions) * 100, 2)
            
            # Timing
            times = list(completed.values_list('time_taken', flat=True))
            self.average_time = sum(times) // len(times)
            self.fastest_time = min(times)
            self.slowest_time = max(times)
        
        # Find easiest and hardest questions
        questions = self.quiz.questions.all()
        
        for question in questions:
            total_answers = QuizAnswer.objects.filter(question=question).count()
            if total_answers > 0:
                correct_answers = QuizAnswer.objects.filter(
                    question=question,
                    is_correct=True
                ).count()
                question.correct_rate = (correct_answers / total_answers) * 100
            else:
                question.correct_rate = 0
        
        if questions:
            questions_sorted = sorted(questions, key=lambda q: q.correct_rate)
            if questions_sorted:
                self.hardest_question = questions_sorted[0]
                self.easiest_question = questions_sorted[-1]
        
        self.save()


class DailyActivity(models.Model):
    """Track daily activity metrics"""
    
    date = models.DateField(unique=True, db_index=True)
    
    # User metrics
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    
    # Quiz metrics
    quizzes_attempted = models.IntegerField(default=0)
    quizzes_completed = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    
    # Resource metrics
    resources_viewed = models.IntegerField(default=0)
    resources_downloaded = models.IntegerField(default=0)
    
    # Kahoot metrics
    kahoot_rooms_created = models.IntegerField(default=0)
    kahoot_participants = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'daily_activity'
        ordering = ['-date']
        verbose_name = 'Daily Activity'
        verbose_name_plural = 'Daily Activities'
    
    def __str__(self):
        return f"Activity for {self.date}"


class Leaderboard(models.Model):
    """Global and category-specific leaderboards"""
    
    LEADERBOARD_TYPE_CHOICES = [
        ('global', 'Global'),
        ('category', 'Category'),
        ('class', 'Class'),
        ('school', 'School'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    leaderboard_type = models.CharField(max_length=20, choices=LEADERBOARD_TYPE_CHOICES)
    
    # Optional filters
    category = models.ForeignKey(
        'resources.Category',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboards'
    )
    class_group = models.ForeignKey(
        'organizations.ClassGroup',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboards'
    )
    school = models.ForeignKey(
        'organizations.School',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='leaderboards'
    )
    
    # Time period (for weekly/monthly)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    
    # Cached rankings (JSON for performance)
    rankings = models.JSONField(default=list)
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leaderboards'
        ordering = ['-last_updated']
        indexes = [
            models.Index(fields=['leaderboard_type', '-last_updated']),
            models.Index(fields=['category', '-last_updated']),
        ]
    
    def __str__(self):
        return f"{self.get_leaderboard_type_display()} Leaderboard"