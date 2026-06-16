import api from './api';
import type {
    AdminUser,
    AdminUserFilters,
    AdminUserPayload,
    PlatformStats,
    Region,
    School,
} from '../types';

// Unwrap DRF responses that may or may not be paginated
const unwrap = <T>(data: any): T[] => (data?.results ? data.results : data);

export const adminService = {
    // ===== Users =============================================================
    getUsers: async (filters?: AdminUserFilters): Promise<AdminUser[]> => {
        const params: Record<string, string> = {};
        if (filters?.role) params.role = filters.role;
        if (filters?.search) params.search = filters.search;
        if (typeof filters?.is_active === 'boolean') params.is_active = String(filters.is_active);
        const response = await api.get<any>('/auth/users/', { params });
        return unwrap<AdminUser>(response.data);
    },

    createUser: async (data: AdminUserPayload): Promise<AdminUser> => {
        const response = await api.post<AdminUser>('/auth/users/', data);
        return response.data;
    },

    updateUser: async (id: number, data: AdminUserPayload): Promise<AdminUser> => {
        const response = await api.patch<AdminUser>(`/auth/users/${id}/`, data);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await api.delete(`/auth/users/${id}/`);
    },

    resetPassword: async (id: number, password: string): Promise<void> => {
        await api.post(`/auth/users/${id}/reset-password/`, { password });
    },

    // ===== Platform statistics ==============================================
    getPlatformStats: async (): Promise<PlatformStats> => {
        const response = await api.get<PlatformStats>('/analytics/platform-stats/');
        return response.data;
    },

    // ===== Regions ==========================================================
    getRegions: async (): Promise<Region[]> => {
        const response = await api.get<any>('/organizations/regions/');
        return unwrap<Region>(response.data);
    },

    createRegion: async (data: Partial<Region>): Promise<Region> => {
        const response = await api.post<Region>('/organizations/regions/', data);
        return response.data;
    },

    updateRegion: async (id: number, data: Partial<Region>): Promise<Region> => {
        const response = await api.patch<Region>(`/organizations/regions/${id}/`, data);
        return response.data;
    },

    deleteRegion: async (id: number): Promise<void> => {
        await api.delete(`/organizations/regions/${id}/`);
    },

    // ===== Schools ==========================================================
    getSchools: async (regionId?: number): Promise<School[]> => {
        const params = regionId ? { region: regionId } : undefined;
        const response = await api.get<any>('/organizations/schools/', { params });
        return unwrap<School>(response.data);
    },

    createSchool: async (data: Record<string, any>): Promise<School> => {
        const response = await api.post<School>('/organizations/schools/', data);
        return response.data;
    },

    updateSchool: async (id: number, data: Record<string, any>): Promise<School> => {
        const response = await api.patch<School>(`/organizations/schools/${id}/`, data);
        return response.data;
    },

    deleteSchool: async (id: number): Promise<void> => {
        await api.delete(`/organizations/schools/${id}/`);
    },
};

export default adminService;
