import api from './api';
import type { Resource, ResourceCategory, ResourceBookmark, ResourceRating, PaginatedResponse } from '../types';

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
    getBookmarks: async (): Promise<ResourceBookmark[]> => {
        const response = await api.get<any>('/resources/bookmarks/');
        if (response.data.results && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        return Array.isArray(response.data) ? response.data : [];
    },

    addBookmark: async (resourceId: number, notes?: string): Promise<ResourceBookmark> => {
        const response = await api.post<ResourceBookmark>('/resources/bookmarks/', {
            resource: resourceId,
            notes,
        });
        return response.data;
    },

    removeBookmark: async (bookmarkId: number): Promise<void> => {
        await api.delete(`/resources/bookmarks/${bookmarkId}/`);
    },

    // Ratings
    getMyRating: async (resourceId: number): Promise<ResourceRating | null> => {
        const response = await api.get<any>('/resources/ratings/', {
            params: { resource: resourceId },
        });
        const list = response.data.results && Array.isArray(response.data.results)
            ? response.data.results
            : (Array.isArray(response.data) ? response.data : []);
        return list.length > 0 ? list[0] : null;
    },

    rateResource: async (resourceId: number, rating: number, review?: string): Promise<ResourceRating> => {
        const response = await api.post<ResourceRating>('/resources/ratings/', {
            resource: resourceId,
            rating,
            review,
        });
        return response.data;
    },
};

export default resourceService;
