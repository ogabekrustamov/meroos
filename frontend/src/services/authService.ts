import api, { setTokens, clearTokens } from './api';
import type { User, TeacherPermissions, LoginResponse } from '../types';

// Authentication API
export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login/', { username, password });
        setTokens(response.data.access, response.data.refresh);
        return response.data;
    },

    register: async (data: any): Promise<User> => {
        const response = await api.post<User>('/auth/register/', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout/');
        } catch {
            // Ignore logout errors
        } finally {
            clearTokens();
        }
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/auth/me/');
        return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.patch<User>('/auth/me/', data);
        return response.data;
    },

    getPermissions: async (): Promise<TeacherPermissions> => {
        const response = await api.get<TeacherPermissions>('/auth/permissions/');
        return response.data;
    },
};

export default authService;
