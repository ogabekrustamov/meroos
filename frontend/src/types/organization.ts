// Organizations Types

export interface Region {
    id: number;
    name: string;
    code?: string;
}

export interface School {
    id: number;
    name: string;
    school_number?: string;
    region: Region;
    address?: string;
    total_students?: number;
    total_teachers?: number;
    total_classes?: number;
}

export interface ClassGroup {
    id: number;
    name: string;
    grade_level: number;
    section: string;
    school: School;
    academic_year: string;
    max_students: number;
    current_student_count?: number;
}

export interface TeacherClassAssignment {
    id: number;
    teacher: number;
    teacher_username: string;
    class_group: number;
    class_name: string;
    subject: number | null;
    subject_name: string | null;
    is_active: boolean;
    assigned_from?: string;
    assigned_until?: string;
}
