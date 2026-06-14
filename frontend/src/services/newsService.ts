import api from './api';
import type { NewsPost, NewsCategory, NewsComment, PaginatedResponse } from '../types';

interface NewsFilters {
    category?: number;
    post_type?: string;
    is_featured?: boolean;
    search?: string;
    page?: number;
}

export const newsService = {
    // Categories
    getCategories: async (): Promise<NewsCategory[]> => {
        const response = await api.get<NewsCategory[]>('/news/categories/');
        return response.data;
    },

    // Posts
    getPosts: async (filters?: NewsFilters): Promise<PaginatedResponse<NewsPost>> => {
        const response = await api.get<PaginatedResponse<NewsPost>>('/news/posts/', { params: filters });
        return response.data;
    },

    getPost: async (id: number): Promise<NewsPost> => {
        const response = await api.get<NewsPost>(`/news/posts/${id}/`);
        return response.data;
    },

    createPost: async (data: FormData): Promise<NewsPost> => {
        const response = await api.post<NewsPost>('/news/posts/', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    updatePost: async (id: number, data: FormData): Promise<NewsPost> => {
        const response = await api.patch<NewsPost>(`/news/posts/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deletePost: async (id: number): Promise<void> => {
        await api.delete(`/news/posts/${id}/`);
    },

    // Comments
    getComments: async (postId: number): Promise<NewsComment[]> => {
        const response = await api.get<NewsComment[] | PaginatedResponse<NewsComment>>('/news/comments/', {
            params: { post: postId, parent_only: 'true' }
        });

        // Handle paginated response
        if (response.data && 'results' in response.data) {
            return (response.data as PaginatedResponse<NewsComment>).results;
        }

        // Handle flat array response
        return Array.isArray(response.data) ? response.data : [];
    },

    addComment: async (postId: number, content: string, parentId?: number): Promise<NewsComment> => {
        const response = await api.post<NewsComment>('/news/comments/', {
            post: postId,
            content,
            parent: parentId || null,
        });
        return response.data;
    },
};

export default newsService;
