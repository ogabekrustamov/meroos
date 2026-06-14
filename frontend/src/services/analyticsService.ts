import api from './api';
import type { UserStatistics, ClassStatistics, Leaderboard } from '../types';

interface LeaderboardFilters {
    category?: number;
    type?: 'weekly' | 'monthly' | 'all_time';
}

export const analyticsService = {
    // Student statistics
    getMyStats: async (): Promise<UserStatistics> => {
        const response = await api.get<any>('/analytics/my-stats/');
        return {
            ...response.data.overview,
            category_breakdown: response.data.by_category
        };
    },

    // Teacher: view student stats
    getStudentStats: async (studentId: number): Promise<UserStatistics> => {
        // Backend uses detail=True, so URL is /<id>/student-stats/
        const response = await api.get<any>(`/analytics/${studentId}/student-stats/`);
        return {
            ...response.data.overview,
            category_breakdown: response.data.by_category
        };
    },

    // Teacher: view class stats
    getClassStats: async (classId: number): Promise<ClassStatistics> => {
        // Backend uses detail=True, so URL is /<id>/class-stats/
        const response = await api.get<any>(`/analytics/${classId}/class-stats/`);
        // Backend returns { class: {...}, top_students: [...] }
        return response.data.class;
    },

    // Global leaderboard
    getLeaderboard: async (filters?: LeaderboardFilters): Promise<Leaderboard> => {
        const response = await api.get<Leaderboard>('/analytics/leaderboard/', { params: filters });
        return response.data;
    },
};

export default analyticsService;
