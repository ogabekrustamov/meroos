import api from './api';
import type { StudentProfile } from '../types';

export interface Teacher {
    id: number;
    name: string;
    subject: string;
    initials: string;
    avatar: string | null;
}

export const studentService = {
    // Get all active teachers
    getTeachers: async (): Promise<Teacher[]> => {
        const response = await api.get<Teacher[]>('/auth/students/teachers/');
        return response.data;
    },

    // Get all students (filtered by teacher's classes in backend)
    getStudents: async (): Promise<StudentProfile[]> => {
        const response = await api.get<any>('/auth/students/');
        // Handle pagination
        if (response.data.results) {
            return response.data.results;
        }
        return response.data as any;
    },

    // Get a specific student profile
    getStudent: async (id: number): Promise<StudentProfile> => {
        const response = await api.get<StudentProfile>(`/auth/students/${id}/`);
        return response.data;
    },

    // Assign a student to a class
    assignClass: async (profileId: number, classGroupId: number): Promise<StudentProfile> => {
        const response = await api.post<StudentProfile>(`/auth/students/${profileId}/assign-class/`, {
            class_group: classGroupId
        });
        return response.data;
    },

    // Note: Creating students is handled by authService.register
};

export default studentService;
