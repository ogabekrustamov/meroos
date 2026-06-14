import api from './api';
import type { TeacherClassAssignment, ClassGroup } from '../types';

export const organizationService = {
    // Get all classes assigned to the current teacher
    getMyAssignments: async (): Promise<TeacherClassAssignment[]> => {
        const response = await api.get<any>('/organizations/assignments/');
        // Handle pagination
        if (response.data.results) {
            return response.data.results;
        }
        return response.data as any;
    },

    // Get all classes (filtered by school/teacher in backend)
    getClasses: async (): Promise<ClassGroup[]> => {
        const response = await api.get<any>('/organizations/classes/');
        // Handle pagination
        if (response.data.results) {
            return response.data.results;
        }
        return response.data as any;
    },

    // Create a new class
    createClass: async (data: Partial<ClassGroup>): Promise<ClassGroup> => {
        const response = await api.post<ClassGroup>('/organizations/classes/', data);
        return response.data;
    },

    // Update a class
    updateClass: async (id: number, data: Partial<ClassGroup>): Promise<ClassGroup> => {
        const response = await api.patch<ClassGroup>(`/organizations/classes/${id}/`, data);
        return response.data;
    },

    // Delete a class
    deleteClass: async (id: number): Promise<void> => {
        await api.delete(`/organizations/classes/${id}/`);
    },
};

export default organizationService;
