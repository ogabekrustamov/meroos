import type { User } from './auth';


export interface StudentProfile {
    id: number;
    student: User; // The user object (snippet)
    class_group: number | null; // ID
    class_group_name: string | null;
    student_id: string | null;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
    date_of_birth: string | null;
    enrollment_date: string;
    total_quizzes_taken: number;
    average_score: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    created_at: string;
    updated_at: string;
}
