import React, { useEffect, useState } from 'react';
import { analyticsService, organizationService } from '../../services';
import type { ClassStatistics, TeacherClassAssignment } from '../../types';

const ClassStatsPage: React.FC = () => {
    const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [stats, setStats] = useState<ClassStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);

    // Load teacher's classes
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await organizationService.getMyAssignments();
                setAssignments(data);
                if (data.length > 0) {
                    setSelectedClassId(data[0].class_group);
                }
            } catch (error) {
                console.error('Failed to fetch classes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // Load stats when class changes
    useEffect(() => {
        if (!selectedClassId) return;

        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const data = await analyticsService.getClassStats(selectedClassId);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch class stats:', error);
                setStats(null);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, [selectedClassId]);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedClassId(Number(e.target.value));
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🏫</div>
                <h3 className="empty-state-title">No Classes Assigned</h3>
                <p className="empty-state-description">You are not currently assigned to any classes.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">Class Statistics</h1>
                    <p className="text-secondary">Track performance and engagement</p>
                </div>

                {/* Class Selector */}
                <div>
                    <select
                        className="input"
                        value={selectedClassId || ''}
                        onChange={handleClassChange}
                        style={{ minWidth: '200px' }}
                    >
                        {assignments.map((assignment) => (
                            <option key={assignment.id} value={assignment.class_group}>
                                {assignment.class_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loadingStats ? (
                <div className="loading-overlay" style={{ position: 'relative', minHeight: '300px' }}>
                    <div className="spinner"></div>
                </div>
            ) : stats ? (
                <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="stat-card">
                            <div className="stat-card-icon">👥</div>
                            <div className="stat-card-value">{stats.total_students}</div>
                            <div className="stat-card-label">Total Students</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                                📝
                            </div>
                            <div className="stat-card-value">{stats.total_quizzes_completed}</div>
                            <div className="stat-card-label">Quizzes Completed</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                                📊
                            </div>
                            <div className="stat-card-value">{stats.average_class_score.toFixed(1)}%</div>
                            <div className="stat-card-label">Avg Class Score</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                                🔥
                            </div>
                            <div className="stat-card-value">{stats.average_streak.toFixed(1)}</div>
                            <div className="stat-card-label">Avg Streak (Days)</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Top Performer */}
                        <div className="card">
                            <div className="card-header">
                                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>🏆 Top Performer</h2>
                            </div>
                            <div className="card-body flex flex-col items-center text-center">
                                <div className="avatar avatar-lg" style={{ marginBottom: 'var(--space-4)', background: 'var(--gradient-primary)', color: 'white' }}>
                                    {stats.top_student_username?.charAt(0) || '?'}
                                </div>
                                <h3 className="font-bold text-lg">{stats.top_student_username || 'N/A'}</h3>
                                <div className="badge badge-success" style={{ marginTop: 'var(--space-2)' }}>
                                    {stats.top_student_score.toFixed(1)}% Avg
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity or other charts could go here */}
                        <div className="card">
                            <div className="card-header">
                                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>📅 Activity Overview</h2>
                            </div>
                            <div className="card-body">
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                                    <span className="text-secondary">Quizzes Attempted</span>
                                    <span className="font-medium">{stats.total_quizzes_attempted}</span>
                                </div>
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
                                    <span className="text-secondary">Completion Rate</span>
                                    <span className="font-medium">
                                        {stats.total_quizzes_attempted > 0
                                            ? ((stats.total_quizzes_completed / stats.total_quizzes_attempted) * 100).toFixed(1)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-secondary">Active Students (7 days)</span>
                                    <span className="font-medium">{stats.active_students}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3 className="empty-state-title">No Statistics Available</h3>
                    <p className="empty-state-description">No data found for this class yet.</p>
                </div>
            )}
        </div>
    );
};

export default ClassStatsPage;
