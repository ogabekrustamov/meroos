import api from './api';
import type { Resource, ResourceCategory, PaginatedResponse } from '../types';

interface ResourceFilters {
    category?: number;
    resource_type?: string;
    search?: string;
    page?: number;
}

export const resourceService = {
    // Categories
    getCategories: async (): Promise<ResourceCategory[]> => {
        const response = await api.get<any>('/resources/categories/');
        // Handle pagination vs direct list
        if (response.data.results && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    },

    // Resources
    getResources: async (filters?: ResourceFilters): Promise<PaginatedResponse<Resource>> => {
        const response = await api.get<PaginatedResponse<Resource>>('/resources/', { params: filters });
        return response.data;
    },

    getResource: async (id: number): Promise<Resource> => {
        const response = await api.get<Resource>(`/resources/${id}/`);
        return response.data;
    },

    uploadResource: async (data: FormData): Promise<Resource> => {
        const response = await api.post<Resource>('/resources/', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    updateResource: async (id: number, data: FormData): Promise<Resource> => {
        const response = await api.patch<Resource>(`/resources/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteResource: async (id: number): Promise<void> => {
        await api.delete(`/resources/${id}/`);
    },

    // View tracking
    viewResource: async (id: number): Promise<void> => {
        await api.post(`/resources/${id}/view/`);
    },

    // Download
    getDownloadUrl: (id: number): string => {
        return `${api.defaults.baseURL}/resources/${id}/download/`;
    },

    // Bookmarks
    bookmarkResource: async (id: number, notes?: string): Promise<void> => {
        await api.post(`/resources/${id}/bookmark/`, { notes });
    },

    // Ratings
    rateResource: async (id: number, rating: number, review?: string): Promise<void> => {
        await api.post(`/resources/${id}/rate/`, { rating, review });
    },
};

export default resourceService;
