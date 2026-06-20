import React, { useEffect, useState } from 'react';
import { ClipboardList, BarChart3, Star, Flame, Trophy, BookOpen, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import { analyticsService, authService } from '../../services';
import type { UserStatistics } from '../../types';

interface ProfilePageProps {
    // 'profile' → identity + account (header, info, change password)
    // 'stats'   → analytics only (stat cards, rankings, performance by category)
    view?: 'profile' | 'stats';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ view = 'profile' }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const showStats = view === 'stats';
    const [stats, setStats] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState(showStats);

    // Change-password form
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwBusy, setPwBusy] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (newPassword !== confirmPassword) {
            setPwError(t('profile.passwordsNoMatch'));
            return;
        }
        if (newPassword.length < 6) {
            setPwError(t('profile.passwordTooShort'));
            return;
        }

        setPwBusy(true);
        try {
            await authService.changePassword(oldPassword, newPassword);
            setPwSuccess(t('profile.passwordChanged'));
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const data = err?.response?.data;
            const message =
                data?.old_password?.[0] ||
                data?.new_password?.[0] ||
                data?.detail ||
                t('profile.passwordFailed');
            setPwError(message);
        } finally {
            setPwBusy(false);
        }
    };

    // Stats are only needed for the stats view (students only).
    useEffect(() => {
        if (!showStats || user?.role !== 'student') return;
        let active = true;
        (async () => {
            try {
                const statsData = await analyticsService.getMyStats();
                if (active) setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [user, showStats]);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // ===================== STATS VIEW (/profile/stats) =====================
    if (showStats) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {stats ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                            <div className="stat-card">
                                <div className="stat-card-icon"><ClipboardList size={24} strokeWidth={1.85} /></div>
                                <div className="stat-card-value">{stats.total_quizzes_completed}</div>
                                <div className="stat-card-label">{t('profile.quizzesCompleted')}</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                                    <BarChart3 size={24} strokeWidth={1.85} />
                                </div>
                                <div className="stat-card-value">{stats.average_score_percentage.toFixed(1)}%</div>
                                <div className="stat-card-label">{t('profile.averageScore')}</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                                    <Star size={24} strokeWidth={1.85} />
                                </div>
                                <div className="stat-card-value">{stats.total_points_earned}</div>
                                <div className="stat-card-label">{t('profile.totalPoints')}</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                                    <Flame size={24} strokeWidth={1.85} />
                                </div>
                                <div className="stat-card-value">{stats.current_streak_days}</div>
                                <div className="stat-card-label">{t('profile.dayStreak')}</div>
                            </div>
                        </div>

                        {/* Rankings */}
                        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                            <div className="card-header">
                                <h2 style={{ fontSize: 'var(--font-size-xl)' }}><Trophy size={20} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('profile.rankings')}</h2>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-primary-600)' }}>
                                            #{stats.class_rank || '-'}
                                        </div>
                                        <div className="text-secondary">{t('profile.classRank')}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-secondary-600)' }}>
                                            #{stats.school_rank || '-'}
                                        </div>
                                        <div className="text-secondary">{t('profile.schoolRank')}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-accent-600)' }}>
                                            #{stats.global_rank || '-'}
                                        </div>
                                        <div className="text-secondary">{t('profile.globalRank')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        {stats.category_breakdown.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}><BookOpen size={20} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('profile.performanceByCategory')}</h2>
                                </div>
                                <div className="card-body">
                                    {stats.category_breakdown.map((cat, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                                                <span className="font-medium">{cat.category}</span>
                                                <span className="text-secondary text-sm">
                                                    {t('profile.categoryQuizzesAvg', { count: cat.quizzes_completed, score: cat.average_score.toFixed(1) })}
                                                </span>
                                            </div>
                                            <div className="progress">
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${cat.average_score}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><BarChart3 size={64} strokeWidth={1.75} /></div>
                        <h3 className="empty-state-title">{t('profile.noStatsTitle')}</h3>
                        <p className="empty-state-description">{t('profile.noStatsDesc')}</p>
                    </div>
                )}
            </div>
        );
    }

    // ===================== PROFILE VIEW (/profile) =====================
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Profile Header */}
            <div
                className="card"
                style={{ marginBottom: 'var(--space-8)', overflow: 'visible' }}
            >
                <div
                    style={{
                        background: 'var(--gradient-primary)',
                        height: '120px',
                        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                    }}
                />
                <div className="card-body" style={{ paddingTop: 0 }}>
                    <div className="flex items-end gap-6" style={{ marginTop: '-50px' }}>
                        <div
                            className="avatar avatar-xl"
                            style={{
                                border: '4px solid white',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.full_name} />
                            ) : (
                                user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'
                            )}
                        </div>
                        <div style={{ paddingBottom: 'var(--space-2)' }}>
                            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-1)' }}>
                                {user?.full_name || user?.username}
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className={`badge ${user?.role === 'superuser' ? 'badge-error' :
                                    user?.role === 'teacher' ? 'badge-primary' :
                                        user?.role === 'student' ? 'badge-secondary' : 'badge-warning'
                                    }`}>
                                    {user?.role ? t(`roles.${user.role}`) : ''}
                                </span>
                                {user?.email && <span className="text-secondary">{user.email}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Information */}
            <div className="card">
                <div className="card-header">
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{t('profile.profileInformation')}</h2>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="input-label">{t('profile.username')}</label>
                            <p className="font-medium">{user?.username}</p>
                        </div>
                        <div>
                            <label className="input-label">{t('profile.email')}</label>
                            <p className="font-medium">{user?.email || t('profile.notSet')}</p>
                        </div>
                        <div>
                            <label className="input-label">{t('profile.fullName')}</label>
                            <p className="font-medium">{user?.full_name || t('profile.notSet')}</p>
                        </div>
                        <div>
                            <label className="input-label">{t('profile.phone')}</label>
                            <p className="font-medium">{user?.phone_number || t('profile.notSet')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="card" style={{ marginTop: 'var(--space-8)' }}>
                <div className="card-header">
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>
                        <Lock size={20} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('profile.changePassword')}
                    </h2>
                </div>
                <div className="card-body">
                    <form onSubmit={handleChangePassword} style={{ maxWidth: '420px' }}>
                        {pwError && (
                            <div className="toast toast-error" style={{ marginBottom: 'var(--space-4)' }}>
                                {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="toast toast-success" style={{ marginBottom: 'var(--space-4)' }}>
                                {pwSuccess}
                            </div>
                        )}

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="input-label" htmlFor="old-password">{t('profile.currentPassword')}</label>
                            <input
                                id="old-password"
                                type="password"
                                className="input"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="input-label" htmlFor="new-password">{t('profile.newPassword')}</label>
                            <input
                                id="new-password"
                                type="password"
                                className="input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label className="input-label" htmlFor="confirm-password">{t('profile.confirmPassword')}</label>
                            <input
                                id="confirm-password"
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={pwBusy}>
                            {pwBusy ? t('profile.updating') : t('profile.updatePassword')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
