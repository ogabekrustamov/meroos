import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, TeacherPermissions, AuthState, UserRole } from '../types';
import { authService, getAccessToken, clearTokens } from '../services';

interface AuthContextType extends AuthState {
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (permission: keyof TeacherPermissions) => boolean;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Initialize auth state from token
    const initializeAuth = useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            setState({
                user: null,
                permissions: null,
                isAuthenticated: false,
                isLoading: false,
            });
            return;
        }

        try {
            const user = await authService.getCurrentUser();
            let permissions: TeacherPermissions | null = null;

            if (user.role === 'teacher') {
                try {
                    permissions = await authService.getPermissions();
                } catch {
                    // Teacher may not have permissions set
                }
            }

            setState({
                user,
                permissions,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            clearTokens();
            setState({
                user: null,
                permissions: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async (username: string, password: string) => {
        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const response = await authService.login(username, password);
            let permissions: TeacherPermissions | null = null;

            if (response.user.role === 'teacher') {
                try {
                    permissions = await authService.getPermissions();
                } catch {
                    // Teacher may not have permissions set
                }
            }

            setState({
                user: response.user,
                permissions,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            setState((prev) => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        setState({
            user: null,
            permissions: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const hasPermission = (permission: keyof TeacherPermissions): boolean => {
        if (!state.user) return false;
        if (state.user.role === 'superuser') return true;
        if (state.user.role !== 'teacher') return false;
        if (!state.permissions) return false;
        return !!state.permissions[permission];
    };

    const hasRole = (roles: UserRole | UserRole[]): boolean => {
        if (!state.user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(state.user.role);
    };

    const refreshUser = async () => {
        await initializeAuth();
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                hasPermission,
                hasRole,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
