// Analytics Types

export interface UserStatistics {
    total_quizzes_attempted: number;
    total_quizzes_completed: number;
    total_quizzes_passed: number;
    average_score_percentage: number;
    highest_score_percentage: number;
    total_points_earned: number;
    current_streak_days: number;
    longest_streak_days: number;
    global_rank: number | null;
    class_rank: number | null;
    school_rank: number | null;
    category_breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
    category: string;
    quizzes_completed: number;
    average_score: number;
}

export interface ClassStatistics {
    class_group: number;
    class_name: string;
    total_students: number;
    active_students: number;
    total_quizzes_attempted: number;
    total_quizzes_completed: number;
    average_class_score: number;
    average_streak: number;
    top_student: number | null;
    top_student_username: string | null;
    top_student_score: number;
    last_updated: string;
}

export interface TopStudent {
    id: number;
    username: string;
    full_name: string;
    average_score: number;
    rank: number;
}

export interface LeaderboardEntry {
    rank: number;
    user: {
        id: number;
        username: string;
        full_name: string;
    };
    total_points: number;
    average_score: number;
    quizzes_completed: number;
}

export interface Leaderboard {
    leaderboard_type: 'global' | 'category' | 'class' | 'school';
    period?: 'weekly' | 'monthly' | 'all_time';
    rankings: LeaderboardEntry[];
}
