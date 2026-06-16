// Organizations Types

export interface Region {
    id: number;
    name: string;
    code?: string;
    description?: string;
    is_active?: boolean;
    total_schools?: number;
    total_students?: number;
}

export interface School {
    id: number;
    name: string;
    school_number?: string;
    // API serializes the FK as the region id and adds region_name alongside it
    region: number;
    region_name?: string;
    address?: string;
    phone_number?: string;
    email?: string;
    principal_name?: string;
    is_active?: boolean;
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
