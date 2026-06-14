// User and Authentication Types

export type UserRole = 'superuser' | 'teacher' | 'student' | 'guest';

export interface User {
  id: number;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  avatar: string | null;
  phone_number: string | null;
  school?: {
    id: number;
    name: string;
  } | null;
}

export interface TeacherPermissions {
  can_create_news: boolean;
  can_edit_news: boolean;
  can_delete_news: boolean;
  can_upload_resources: boolean;
  can_edit_resources: boolean;
  can_delete_resources: boolean;
  can_create_quizzes: boolean;
  can_edit_quizzes: boolean;
  can_delete_quizzes: boolean;
  can_host_kahoot: boolean;
  can_create_students: boolean;
  can_manage_classes: boolean;
  can_view_student_stats: boolean;
  allowed_categories: number[];
  can_create_schools: boolean;
  can_create_classes: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface AuthState {
  user: User | null;
  permissions: TeacherPermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
