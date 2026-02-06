"""
WebSocket consumer for real-time Kahoot-style quizzes
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class KahootConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for Kahoot-style quiz rooms
    
    Message types:
    - join: Player joins the room
    - start_quiz: Host starts the quiz
    - next_question: Host moves to next question
    - submit_answer: Player submits answer
    - update_leaderboard: Broadcast updated leaderboard
    - end_quiz: Host ends the quiz
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'kahoot_{self.room_code}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Verify room exists and get its status
        room_status = await self.get_room_status()
        if room_status is None:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Room not found'
            }))
            await self.close()
            return
        
        # If room is already in progress, send current question to newly connected client
        if room_status == 'in_progress':
            question_data = await self.get_current_question()
            if question_data:
                await self.send(text_data=json.dumps({
                    'type': 'quiz_started',
                    'question': question_data
                }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'join':
            await self.handle_join(data)
        elif message_type == 'start_quiz':
            await self.handle_start_quiz(data)
        elif message_type == 'next_question':
            await self.handle_next_question(data)
        elif message_type == 'show_question_results':
            await self.handle_show_question_results(data)
        elif message_type == 'show_leaderboard':
            await self.handle_show_leaderboard(data)
        elif message_type == 'submit_answer':
            await self.handle_submit_answer(data)
        elif message_type == 'end_quiz':
            await self.handle_end_quiz(data)
    
    async def handle_join(self, data):
        """Handle player joining the room"""
        user_id = data.get('user_id')
        username = data.get('username')
        
        # Add player to room
        success = await self.add_player_to_room(user_id, username)
        
        if success:
            # Broadcast to all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_joined',
                    'user_id': user_id,
                    'username': username,
                    'total_players': await self.get_player_count()
                }
            )
        else:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to join room'
            }))
    
    async def handle_start_quiz(self, data):
        """Handle quiz start by host"""
        user_id = data.get('user_id')
        
        # Verify user is host
        is_host = await self.verify_host(user_id)
        if not is_host:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Only the host can start the quiz'
            }))
            return
        
        # Start quiz
        success = await self.start_quiz()
        
        if success:
            # Get first question
            question_data = await self.get_current_question()
            
            # Broadcast to all players
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'quiz_started',
                    'question': question_data
                }
            )
    
    async def handle_next_question(self, data):
        """Handle moving to next question"""
        user_id = data.get('user_id')
        
        # Verify user is host
        is_host = await self.verify_host(user_id)
        if not is_host:
            return
        
        # Move to next question
        has_next = await self.advance_to_next_question()
        
        if has_next:
            question_data = await self.get_current_question()
            
            # Broadcast new question
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'next_question',
                    'question': question_data
                }
            )
        else:
            # No more questions, end quiz
            await self.handle_end_quiz(data)

    async def handle_show_question_results(self, data):
        """Handle showing question results (histogram/correct answer)"""
        user_id = data.get('user_id')
        
        # Verify user is host
        is_host = await self.verify_host(user_id)
        if not is_host:
            return
            
        # Get current question stats
        stats = await self.get_question_stats()
        
        # Broadcast results
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'question_results',
                'stats': stats
            }
        )

    async def handle_show_leaderboard(self, data):
        """Handle showing leaderboard between questions"""
        user_id = data.get('user_id')
        
        # Verify user is host
        is_host = await self.verify_host(user_id)
        if not is_host:
            return
            
        leaderboard = await self.get_leaderboard()
        
        # Broadcast leaderboard
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'leaderboard_update',
                'leaderboard': leaderboard,
                'is_interim': True  # Flag to indicate this is an interim leaderboard
            }
        )
    
    async def handle_submit_answer(self, data):
        """Handle player submitting an answer"""
        user_id = data.get('user_id')
        answer_ids = data.get('answer_ids', [])
        time_taken = data.get('time_taken', 0)
        
        # Save answer
        result = await self.save_answer(user_id, answer_ids, time_taken)
        
        # Update leaderboard
        leaderboard = await self.get_leaderboard()
        
        # Broadcast updated leaderboard
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'leaderboard_update',
                'leaderboard': leaderboard,
                'answer_submitted': True,
                'user_id': user_id
            }
        )
    
    async def handle_end_quiz(self, data):
        """Handle quiz end"""
        user_id = data.get('user_id')
        
        # Verify user is host
        is_host = await self.verify_host(user_id)
        if not is_host:
            return
        
        # End quiz
        final_results = await self.end_quiz()
        
        # Broadcast final results
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_ended',
                'results': final_results
            }
        )
    
    # Broadcast handlers
    async def player_joined(self, event):
        """Broadcast player joined"""
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'total_players': event['total_players']
        }))
    
    async def quiz_started(self, event):
        """Broadcast quiz started"""
        await self.send(text_data=json.dumps({
            'type': 'quiz_started',
            'question': event['question']
        }))
    
    async def next_question(self, event):
        """Broadcast next question"""
        await self.send(text_data=json.dumps({
            'type': 'next_question',
            'question': event['question']
        }))
    
    async def leaderboard_update(self, event):
        """Broadcast leaderboard update"""
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'leaderboard': event['leaderboard'],
            'is_interim': event.get('is_interim', False),
            'answer_submitted': event.get('answer_submitted', False),
            'user_id': event.get('user_id')
        }))
    
    async def quiz_ended(self, event):
        """Broadcast quiz ended"""
        await self.send(text_data=json.dumps({
            'type': 'quiz_ended',
            'results': event['results']
        }))

    async def question_results(self, event):
        """Broadcast question results"""
        await self.send(text_data=json.dumps({
            'type': 'question_results',
            'stats': event['stats']
        }))
    
    # Database operations
    @database_sync_to_async
    def verify_room(self):
        """Verify that the room exists and is active"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(
                room_code=self.room_code,
                status__in=['waiting', 'in_progress']
            )
            return True
        except KahootRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def get_room_status(self):
        """Get the room status or None if not found"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(
                room_code=self.room_code,
                status__in=['waiting', 'in_progress']
            )
            return room.status
        except KahootRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def verify_host(self, user_id):
        """Verify that user is the host"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            # Convert user_id to int for comparison (JWT might send as string or different type)
            is_host = room.host_id == int(user_id) if user_id else False
            print(f"verify_host: user_id={user_id}, host_id={room.host_id}, is_host={is_host}")
            return is_host
        except Exception as e:
            print(f"verify_host error: {e}")
            return False
    
    @database_sync_to_async
    def add_player_to_room(self, user_id, username):
        """Add player to the room"""
        from quizzes.models import KahootRoom, QuizAttempt
        from accounts.models import User
        
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            user = User.objects.get(id=user_id)
            
            # Check if room is full
            if room.total_participants >= room.max_players:
                return False
            
            # Check if quiz already started and late join is not allowed
            if room.status == 'in_progress' and not room.allow_late_join:
                return False
            
            # Create or get attempt
            attempt, created = QuizAttempt.objects.get_or_create(
                quiz=room.quiz,
                user=user,
                kahoot_room=room,
                defaults={
                    'status': 'in_progress',
                    'max_score': room.quiz.total_points
                }
            )
            
            return True
        except Exception as e:
            print(f"Error adding player: {e}")
            return False
    
    @database_sync_to_async
    def get_player_count(self):
        """Get total number of players in room"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            return room.total_participants
        except:
            return 0
    
    @database_sync_to_async
    def start_quiz(self):
        """Start the quiz"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            room.status = 'in_progress'
            room.started_at = timezone.now()
            room.current_question_index = 0
            room.save()
            return True
        except:
            return False
    
    @database_sync_to_async
    def get_current_question(self):
        """Get current question data"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            questions = list(room.quiz.questions.all().order_by('order'))
            
            if room.current_question_index >= len(questions):
                return None
            
            question = questions[room.current_question_index]
            
            return {
                'id': question.id,
                'text': question.question_text,
                'question_text': question.question_text,  # For student page compatibility
                'image': question.image.url if question.image else None,
                'type': question.question_type,
                'points': question.points,
                'time_limit': room.quiz.time_per_question,
                'options': [
                    {
                        'id': opt.id,
                        'text': opt.option_text,
                        'option_text': opt.option_text,  # For student page compatibility
                        'image': opt.image.url if opt.image else None
                    }
                    for opt in question.options.all().order_by('order')
                ],
                'question_number': room.current_question_index + 1,
                'total_questions': len(questions)
            }
        except Exception as e:
            print(f"Error getting question: {e}")
            return None
    
    @database_sync_to_async
    def advance_to_next_question(self):
        """Move to next question"""
        from quizzes.models import KahootRoom
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            room.current_question_index += 1
            room.save()
            
            # Check if there are more questions
            total_questions = room.quiz.questions.count()
            return room.current_question_index < total_questions
        except:
            return False
    
    @database_sync_to_async
    def save_answer(self, user_id, answer_ids, time_taken):
        """Save player's answer"""
        from quizzes.models import (
            KahootRoom, QuizAttempt, QuizAnswer,
            Question, QuestionOption
        )
        from accounts.models import User
        
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            user = User.objects.get(id=user_id)
            
            # Get current question
            questions = list(room.quiz.questions.all().order_by('order'))
            question = questions[room.current_question_index]
            
            # Get or create attempt
            attempt = QuizAttempt.objects.get(
                quiz=room.quiz,
                user=user,
                kahoot_room=room
            )
            
            # Create answer
            answer, created = QuizAnswer.objects.get_or_create(
                attempt=attempt,
                question=question,
                defaults={'time_taken': time_taken}
            )
            
            # Add selected options
            answer.selected_options.set(answer_ids)
            
            # Check correctness
            answer.check_correctness()
            
            # Update leaderboard
            self.update_leaderboard_entry(room, user, attempt)
            
            return True
        except Exception as e:
            print(f"Error saving answer: {e}")
            return False
    
    def update_leaderboard_entry(self, room, user, attempt):
        """Update leaderboard entry for user"""
        from quizzes.models import KahootLeaderboard
        
        # Calculate total score from answers
        total_score = sum(
            answer.points_earned
            for answer in attempt.answers.all()
        )
        
        # Count correct answers
        correct_count = attempt.answers.filter(is_correct=True).count()
        
        # Calculate average time
        times = list(attempt.answers.values_list('time_taken', flat=True))
        avg_time = sum(times) / len(times) if times else 0
        
        # Update or create leaderboard entry
        leaderboard_entry, _ = KahootLeaderboard.objects.update_or_create(
            room=room,
            user=user,
            defaults={
                'total_score': total_score,
                'correct_answers': correct_count,
                'average_time': avg_time
            }
        )
        
        # Recalculate ranks
        entries = KahootLeaderboard.objects.filter(room=room).order_by(
            '-total_score',
            'average_time'
        )
        
        for rank, entry in enumerate(entries, start=1):
            entry.rank = rank
            entry.save(update_fields=['rank'])
    
    @database_sync_to_async
    def get_leaderboard(self):
        """Get current leaderboard"""
        from quizzes.models import KahootRoom, KahootLeaderboard
        
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            entries = KahootLeaderboard.objects.filter(room=room).order_by('rank')[:10]
            
            return [
                {
                    'rank': entry.rank,
                    'user_id': entry.user_id,
                    'username': entry.user.username,
                    'score': entry.total_score,
                    'correct_answers': entry.correct_answers,
                    'average_time': round(entry.average_time, 2)
                }
                for entry in entries
            ]
        except Exception as e:
            print(f"Error getting leaderboard: {e}")
            return []
    
    @database_sync_to_async
    def end_quiz(self):
        """End the quiz and get final results"""
        from quizzes.models import KahootRoom, QuizAttempt
        
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            room.status = 'completed'
            room.ended_at = timezone.now()
            room.save()
            
            # Complete all attempts
            attempts = QuizAttempt.objects.filter(
                kahoot_room=room,
                status='in_progress'
            )
            
            for attempt in attempts:
                attempt.complete()
            
            # Get final leaderboard
            leaderboard = list(
                room.leaderboard_entries.all().order_by('rank')
            )
            
            return {
                'leaderboard': [
                    {
                        'rank': entry.rank,
                        'user_id': entry.user_id,
                        'username': entry.user.username,
                        'score': entry.total_score,
                        'correct_answers': entry.correct_answers,
                        'average_time': round(entry.average_time, 2)
                    }
                    for entry in leaderboard
                ],
                'total_participants': len(leaderboard),
                'quiz_title': room.quiz.title
            }
        except Exception as e:
            print(f"Error ending quiz: {e}")
            return {}

    @database_sync_to_async
    def get_question_stats(self):
        """Get statistics for the current question"""
        from quizzes.models import (
            KahootRoom, QuestionOption, QuizAnswer
        )
        from django.db.models import Count
        
        try:
            room = KahootRoom.objects.get(room_code=self.room_code)
            questions = list(room.quiz.questions.all().order_by('order'))
            
            if room.current_question_index >= len(questions):
                return {}
            
            question = questions[room.current_question_index]
            
            # Get all options for this question
            options = QuestionOption.objects.filter(question=question).order_by('order')
            
            # Count answers for each option
            # This is complex because selected_options is M2M
            stats = []
            total_answers = 0
            
            for option in options:
                count = QuizAnswer.objects.filter(
                    attempt__kahoot_room=room,
                    question=question,
                    selected_options=option
                ).count()
                
                stats.append({
                    'option_id': option.id,
                    'text': option.option_text,
                    'is_correct': option.is_correct,
                    'count': count
                })
                total_answers += count
            
            return {
                'question_id': question.id,
                'total_answers': total_answers,
                'option_stats': stats,
                'correct_option_ids': list(options.filter(is_correct=True).values_list('id', flat=True))
            }
        except Exception as e:
            print(f"Error getting question stats: {e}")
            return {}