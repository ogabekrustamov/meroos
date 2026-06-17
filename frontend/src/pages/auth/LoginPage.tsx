import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertTriangle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useAuth, useTheme } from '../../contexts';
import { API_BASE_URL } from '../../config';
import './LoginPage.css';

interface LocationState {
    from?: { pathname: string };
}

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as LocationState)?.from?.pathname || '/';

    const getRedirectPath = (role: string): string => {
        switch (role) {
            case 'superuser':
                return '/admin';
            case 'teacher':
                return '/teacher';
            case 'student':
                return '/student';
            default:
                return '/guest';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
            // Get user from context after login - for now redirect based on from or default
            // The auth context will have the user, we need to determine redirect
            const response = await fetch(`${API_BASE_URL}/auth/me/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('meroos_access_token')}`,
                },
            });
            const user = await response.json();
            const redirectPath = from !== '/' ? from : getRedirectPath(user.role);
            navigate(redirectPath, { replace: true });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated gradient backdrop */}
            <div className="auth-bg" aria-hidden="true">
                <span className="auth-blob auth-blob-1" />
                <span className="auth-blob auth-blob-2" />
                <span className="auth-blob auth-blob-3" />
            </div>

            {/* Corner controls */}
            <Link to="/" className="auth-top-btn auth-back">
                <ArrowLeft size={16} strokeWidth={2} /> Home
            </Link>
            <button
                type="button"
                className="auth-top-btn auth-toggle"
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
                {isDarkMode ? <Sun size={18} strokeWidth={1.85} /> : <Moon size={18} strokeWidth={1.85} />}
            </button>

            <div className="card card-glass auth-card">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--gradient-primary)',
                            borderRadius: 'var(--radius-2xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-4)',
                            boxShadow: 'var(--shadow-glow)',
                        }}
                    >
                        <span style={{ fontSize: '2.5rem', color: 'white', fontWeight: 'bold' }}>M</span>
                    </div>
                    <h1
                        style={{
                            fontSize: 'var(--font-size-3xl)',
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: 'var(--space-2)',
                        }}
                    >
                        Welcome to Meroos
                    </h1>
                    <p className="text-secondary">Sign in to continue to your dashboard</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="toast toast-error" style={{ marginBottom: 'var(--space-6)' }}>
                        <AlertTriangle size={18} strokeWidth={1.85} />
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label htmlFor="username" className="input-label">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                        <label htmlFor="password" className="input-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }}></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Guest Access */}
                <div
                    style={{
                        marginTop: 'var(--space-6)',
                        paddingTop: 'var(--space-6)',
                        borderTop: '1px solid var(--color-border)',
                        textAlign: 'center',
                    }}
                >
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-3)' }}>
                        Don't have an account?
                    </p>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => navigate('/guest')}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
