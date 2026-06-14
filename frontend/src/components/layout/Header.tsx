import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../../contexts';

interface HeaderProps {
    title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadge = () => {
        switch (user?.role) {
            case 'superuser':
                return <span className="badge badge-error">Admin</span>;
            case 'teacher':
                return <span className="badge badge-primary">Teacher</span>;
            case 'student':
                return <span className="badge badge-secondary">Student</span>;
            case 'guest':
                return <span className="badge badge-warning">Guest</span>;
            default:
                return null;
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                {title && <h1 className="header-title">{title}</h1>}
            </div>

            <div className="header-right">
                {/* Dark Mode Toggle */}
                <button
                    className="btn btn-ghost btn-icon dark-mode-toggle"
                    onClick={toggleDarkMode}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                        fontSize: '1.25rem',
                        marginRight: 'var(--space-2)'
                    }}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>

                {user && (
                    <div className="dropdown">
                        <button
                            className="btn btn-ghost flex items-center gap-3"
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{ padding: 'var(--space-2) var(--space-3)' }}
                        >
                            <div className="avatar avatar-sm">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.full_name} />
                                ) : (
                                    getInitials(user.full_name || user.username)
                                )}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div className="font-medium" style={{ fontSize: 'var(--font-size-sm)' }}>
                                    {user.full_name || user.username}
                                </div>
                                {getRoleBadge()}
                            </div>
                            <span>▾</span>
                        </button>

                        {showDropdown && (
                            <>
                                <div
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 'var(--z-dropdown)',
                                    }}
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="dropdown-menu" style={{ marginTop: 'var(--space-2)' }}>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            navigate('/profile');
                                        }}
                                    >
                                        <span>👤</span>
                                        Profile
                                    </button>
                                    {user.role === 'student' && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setShowDropdown(false);
                                                navigate('/profile/stats');
                                            }}
                                        >
                                            <span>📊</span>
                                            My Stats
                                        </button>
                                    )}
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        <span>🚪</span>
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;

