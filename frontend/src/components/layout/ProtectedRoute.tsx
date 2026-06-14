import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import type { UserRole, TeacherPermissions } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: UserRole[];
    permission?: keyof TeacherPermissions;
    requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    roles,
    permission,
    requireAuth = true,
}) => {
    const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg"></div>
                <p className="text-secondary">Loading...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (roles && roles.length > 0 && !hasRole(roles)) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = user?.role === 'teacher'
            ? '/teacher'
            : user?.role === 'student'
                ? '/student'
                : user?.role === 'superuser'
                    ? '/admin'
                    : '/guest';
        return <Navigate to={redirectPath} replace />;
    }

    // Check permission-based access (for teachers)
    if (permission && !hasPermission(permission)) {
        return (
            <div className="page-content">
                <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <h2 className="empty-state-title">Access Denied</h2>
                    <p className="empty-state-description">
                        You don't have permission to access this feature.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
