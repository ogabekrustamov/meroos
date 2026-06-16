// Admin / superuser management types

import type { UserRole } from './auth';

export interface AdminUser {
    id: number;
    username: string;
    email: string | null;
    first_name: string;
    last_name: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    phone_number: string | null;
    school: number | null;
    school_name: string | null;
    date_joined: string;
    last_login: string | null;
}

export interface AdminUserFilters {
    role?: UserRole;
    is_active?: boolean;
    search?: string;
}

// Payload for creating / updating a user (password optional on update)
export interface AdminUserPayload {
    username?: string;
    email?: string | null;
    first_name?: string;
    last_name?: string;
    role?: UserRole;
    is_active?: boolean;
    phone_number?: string | null;
    school?: number | null;
    password?: string;
}

export interface DailyActivityPoint {
    date: string;
    total_users: number;
    active_users: number;
    new_users: number;
    quizzes_attempted: number;
    quizzes_completed: number;
    average_score: number;
}

export interface PlatformStats {
    users: {
        total: number;
        active: number;
        superusers: number;
        teachers: number;
        students: number;
        guests: number;
    };
    organizations: {
        regions: number;
        schools: number;
        classes: number;
    };
    quizzes: {
        total: number;
        published: number;
        attempts: number;
    };
    recent_activity: DailyActivityPoint[];
}
