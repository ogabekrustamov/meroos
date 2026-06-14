// API Response Types

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ApiError {
    error: string;
    detail?: string;
    code?: string;
}

// Re-export all types
export * from './auth';
export * from './quiz';
export * from './resource';
export * from './student';

export * from './analytics';
export * from './news';
export * from './organization';
