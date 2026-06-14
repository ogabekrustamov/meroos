import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts';
import { analyticsService } from '../../services';
import type { UserStatistics } from '../../types';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (user?.role === 'student') {
                try {
                    const statsData = await analyticsService.getMyStats();
                    setStats(statsData);
                } catch (error) {
                    console.error('Failed to fetch stats:', error);
                }
            }
            setLoading(false);
        };
        fetchStats();
    }, [user]);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

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
                                    {user?.role}
                                </span>
                                {user?.email && <span className="text-secondary">{user.email}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Stats */}
            {user?.role === 'student' && stats && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="stat-card">
                            <div className="stat-card-icon">📝</div>
                            <div className="stat-card-value">{stats.total_quizzes_completed}</div>
                            <div className="stat-card-label">Quizzes Completed</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                                📊
                            </div>
                            <div className="stat-card-value">{stats.average_score_percentage.toFixed(1)}%</div>
                            <div className="stat-card-label">Average Score</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                                ⭐
                            </div>
                            <div className="stat-card-value">{stats.total_points_earned}</div>
                            <div className="stat-card-label">Total Points</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                                🔥
                            </div>
                            <div className="stat-card-value">{stats.current_streak_days}</div>
                            <div className="stat-card-label">Day Streak</div>
                        </div>
                    </div>

                    {/* Rankings */}
                    <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="card-header">
                            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>🏆 Rankings</h2>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-cols-3 gap-6 text-center">
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-primary-600)' }}>
                                        #{stats.class_rank || '-'}
                                    </div>
                                    <div className="text-secondary">Class Rank</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-secondary-600)' }}>
                                        #{stats.school_rank || '-'}
                                    </div>
                                    <div className="text-secondary">School Rank</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', color: 'var(--color-accent-600)' }}>
                                        #{stats.global_rank || '-'}
                                    </div>
                                    <div className="text-secondary">Global Rank</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    {stats.category_breakdown.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>📚 Performance by Category</h2>
                            </div>
                            <div className="card-body">
                                {stats.category_breakdown.map((cat, idx) => (
                                    <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                                        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                                            <span className="font-medium">{cat.category}</span>
                                            <span className="text-secondary text-sm">
                                                {cat.quizzes_completed} quizzes • {cat.average_score.toFixed(1)}%
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
            )}

            {/* Profile Info for non-students */}
            {user?.role !== 'student' && (
                <div className="card">
                    <div className="card-header">
                        <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Profile Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="input-label">Username</label>
                                <p className="font-medium">{user?.username}</p>
                            </div>
                            <div>
                                <label className="input-label">Email</label>
                                <p className="font-medium">{user?.email || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="input-label">Full Name</label>
                                <p className="font-medium">{user?.full_name || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="input-label">Phone</label>
                                <p className="font-medium">{user?.phone_number || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
