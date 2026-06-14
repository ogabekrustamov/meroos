import api from './api';
import type { Quiz, QuizAttempt, AnswerSubmitResponse, KahootRoom, KahootLeaderboard, PaginatedResponse } from '../types';

interface QuizFilters {
    category?: number;
    quiz_type?: string;
    difficulty?: string;
    search?: string;
    page?: number;
}

interface CreateQuizData {
    title: string;
    description: string;
    quiz_type: 'standard' | 'kahoot';
    category: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timing_mode: 'per_question' | 'total_time';
    time_per_question?: number;
    total_time?: number;
    passing_score: number;
    is_published?: boolean;
    questions: {
        question_text: string;
        question_type: 'single' | 'multiple' | 'true_false';
        points: number;
        order?: number;
        options: {
            option_text: string;
            is_correct: boolean;
            order: number;
        }[];
    }[];
}

export const quizService = {
    // Quiz CRUD
    getQuizzes: async (filters?: QuizFilters): Promise<PaginatedResponse<Quiz>> => {
        const response = await api.get<PaginatedResponse<Quiz>>('/quizzes/', { params: filters });
        return response.data;
    },

    getQuiz: async (id: number): Promise<Quiz> => {
        const response = await api.get<Quiz>(`/quizzes/${id}/`);
        return response.data;
    },

    createQuiz: async (data: CreateQuizData): Promise<Quiz> => {
        const response = await api.post<Quiz>('/quizzes/', data);
        return response.data;
    },

    createQuizWithImages: async (data: CreateQuizData, questionImages: (File | null)[]): Promise<Quiz> => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('quiz_type', data.quiz_type);
        formData.append('category', data.category.toString());
        formData.append('difficulty', data.difficulty);
        formData.append('timing_mode', data.timing_mode);
        if (data.time_per_question) formData.append('time_per_question', data.time_per_question.toString());
        if (data.total_time) formData.append('total_time', data.total_time.toString());
        formData.append('passing_score', data.passing_score.toString());
        if (data.is_published !== undefined) formData.append('is_published', data.is_published.toString());

        // Serialize questions as JSON (backend expects this format)
        const questionsWithImages = data.questions.map((q, idx) => ({
            ...q,
            _has_image: questionImages[idx] !== null,
        }));
        formData.append('questions', JSON.stringify(questionsWithImages));

        // Append question images with indexed keys
        questionImages.forEach((img, idx) => {
            if (img) {
                formData.append(`question_image_${idx}`, img);
            }
        });

        const response = await api.post<Quiz>('/quizzes/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    updateQuiz: async (id: number, data: Partial<CreateQuizData>): Promise<Quiz> => {
        const response = await api.patch<Quiz>(`/quizzes/${id}/`, data);
        return response.data;
    },

    updateQuizWithImages: async (id: number, data: Partial<CreateQuizData>, questionImages: (File | null)[]): Promise<Quiz> => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.quiz_type) formData.append('quiz_type', data.quiz_type);
        if (data.category) formData.append('category', data.category.toString());
        if (data.difficulty) formData.append('difficulty', data.difficulty);
        if (data.timing_mode) formData.append('timing_mode', data.timing_mode);
        if (data.time_per_question) formData.append('time_per_question', data.time_per_question.toString());
        if (data.total_time) formData.append('total_time', data.total_time.toString());
        if (data.passing_score !== undefined) formData.append('passing_score', data.passing_score.toString());
        if (data.is_published !== undefined) formData.append('is_published', data.is_published.toString());

        if (data.questions) {
            formData.append('questions', JSON.stringify(data.questions));
            questionImages.forEach((img, idx) => {
                if (img) {
                    formData.append(`question_image_${idx}`, img);
                }
            });
        }

        const response = await api.patch<Quiz>(`/quizzes/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteQuiz: async (id: number): Promise<void> => {
        await api.delete(`/quizzes/${id}/`);
    },

    // Quiz Attempts
    startAttempt: async (quizId: number): Promise<QuizAttempt> => {
        const response = await api.post<QuizAttempt>(`/quizzes/${quizId}/start-attempt/`);
        return response.data;
    },

    submitAnswer: async (
        attemptId: string,
        questionId: number,
        selectedOptionIds: number[],
        timeTaken: number
    ): Promise<AnswerSubmitResponse> => {
        const response = await api.post<AnswerSubmitResponse>(
            `/quizzes/attempts/${attemptId}/submit-answer/`,
            { question_id: questionId, selected_option_ids: selectedOptionIds, time_taken: timeTaken }
        );
        return response.data;
    },

    completeAttempt: async (attemptId: string): Promise<QuizAttempt> => {
        const response = await api.post<QuizAttempt>(`/quizzes/attempts/${attemptId}/complete/`);
        return response.data;
    },

    getMyAttempts: async (): Promise<QuizAttempt[]> => {
        const response = await api.get<QuizAttempt[]>('/quizzes/attempts/');
        return response.data;
    },

    // Teacher: get all attempts for a specific student
    getStudentAttempts: async (studentId: number): Promise<QuizAttempt[]> => {
        const response = await api.get<QuizAttempt[]>('/quizzes/attempts/student-attempts/', {
            params: { student_id: studentId }
        });
        return response.data;
    },

    // Get detailed attempt with per-question answers
    getAttemptDetail: async (attemptId: string): Promise<any> => {
        const response = await api.get<any>(`/quizzes/attempts/${attemptId}/detail/`);
        return response.data;
    },

    // Kahoot Rooms
    createKahootRoom: async (quizId: number, maxPlayers?: number, allowLateJoin?: boolean): Promise<KahootRoom> => {
        const response = await api.post<KahootRoom>('/quizzes/kahoot-rooms/', {
            quiz_id: quizId,
            max_players: maxPlayers || 50,
            allow_late_join: allowLateJoin ?? true,
        });
        return response.data;
    },

    getKahootRoom: async (roomCode: string): Promise<KahootRoom> => {
        const response = await api.get<KahootRoom>(`/quizzes/kahoot-rooms/${roomCode}/`);
        return response.data;
    },

    startKahootRoom: async (roomCode: string): Promise<void> => {
        await api.post(`/quizzes/kahoot-rooms/${roomCode}/start/`);
    },

    endKahootRoom: async (roomCode: string): Promise<void> => {
        await api.post(`/quizzes/kahoot-rooms/${roomCode}/end/`);
    },

    getKahootLeaderboard: async (roomCode: string): Promise<KahootLeaderboard> => {
        const response = await api.get<KahootLeaderboard>(`/quizzes/kahoot-rooms/${roomCode}/leaderboard/`);
        return response.data;
    },
};

export default quizService;
