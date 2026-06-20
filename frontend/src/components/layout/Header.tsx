import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ChevronDown, User, BarChart3, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useTheme } from '../../contexts';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface HeaderProps {
    title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { t } = useTranslation();
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
                return <span className="badge badge-error">{t('roles.superuser')}</span>;
            case 'teacher':
                return <span className="badge badge-primary">{t('roles.teacher')}</span>;
            case 'student':
                return <span className="badge badge-secondary">{t('roles.student')}</span>;
            case 'guest':
                return <span className="badge badge-warning">{t('roles.guest')}</span>;
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
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Dark Mode Toggle */}
                <button
                    className="btn btn-ghost btn-icon dark-mode-toggle"
                    onClick={toggleDarkMode}
                    title={isDarkMode ? t('theme.switchToLight') : t('theme.switchToDark')}
                    style={{
                        fontSize: '1.25rem',
                        marginRight: 'var(--space-2)'
                    }}
                >
                    {isDarkMode ? <Sun size={20} strokeWidth={1.85} /> : <Moon size={20} strokeWidth={1.85} />}
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
                            <div className="header-user-meta" style={{ textAlign: 'left' }}>
                                <div className="font-medium" style={{ fontSize: 'var(--font-size-sm)' }}>
                                    {user.full_name || user.username}
                                </div>
                                {getRoleBadge()}
                            </div>
                            <ChevronDown size={18} strokeWidth={1.85} />
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
                                        <User size={18} strokeWidth={1.85} />
                                        {t('common.profile')}
                                    </button>
                                    {user.role === 'student' && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setShowDropdown(false);
                                                navigate('/profile/stats');
                                            }}
                                        >
                                            <BarChart3 size={18} strokeWidth={1.85} />
                                            {t('common.myStats')}
                                        </button>
                                    )}
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        <LogOut size={18} strokeWidth={1.85} />
                                        {t('common.logout')}
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

