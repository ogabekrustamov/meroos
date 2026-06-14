import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { quizService } from '../../services';
import type { Quiz } from '../../types';

const TeacherDashboard: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const quizzesData = await quizService.getQuizzes({ page: 1 });
                setQuizzes(quizzesData.results.slice(0, 4));
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Section */}
            <div
                style={{
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-8)',
                    marginBottom: 'var(--space-8)',
                    color: 'white',
                }}
            >
                <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                    Good day, {user?.first_name || user?.username}! 👨‍🏫
                </h1>
                <p style={{ opacity: 0.9 }}>
                    Manage your classes, create quizzes, and track student progress.
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-4 gap-4">
                    {hasPermission('can_create_quizzes') && (
                        <Link to="/quizzes/create" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'var(--gradient-primary)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    📝
                                </div>
                                <h3 className="font-semibold">Create Quiz</h3>
                                <p className="text-sm text-secondary">Build new assessments</p>
                            </div>
                        </Link>
                    )}

                    {hasPermission('can_host_kahoot') && (
                        <Link to="/teacher/kahoot/setup" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'var(--gradient-accent)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    🎮
                                </div>
                                <h3 className="font-semibold">Host Kahoot</h3>
                                <p className="text-sm text-secondary">Start live quiz session</p>
                            </div>
                        </Link>
                    )}

                    {hasPermission('can_upload_resources') && (
                        <Link to="/resources/upload" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'var(--gradient-secondary)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    📚
                                </div>
                                <h3 className="font-semibold">Upload Resource</h3>
                                <p className="text-sm text-secondary">Share learning materials</p>
                            </div>
                        </Link>
                    )}

                    {hasPermission('can_view_student_stats') && (
                        <Link to="/teacher/class-stats" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    📊
                                </div>
                                <h3 className="font-semibold">Class Stats</h3>
                                <p className="text-sm text-secondary">View student progress</p>
                            </div>
                        </Link>
                    )}

                    {hasPermission('can_manage_classes') && (
                        <Link to="/teacher/classes" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    🏫
                                </div>
                                <h3 className="font-semibold">My Classes</h3>
                                <p className="text-sm text-secondary">Manage class groups</p>
                            </div>
                        </Link>
                    )}

                    {hasPermission('can_create_students') && (
                        <Link to="/teacher/students" className="card" style={{ textDecoration: 'none' }}>
                            <div className="card-body flex flex-col items-center text-center">
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    🎓
                                </div>
                                <h3 className="font-semibold">Students</h3>
                                <p className="text-sm text-secondary">Manage enrollment</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card">
                    <div className="stat-card-icon">📝</div>
                    <div className="stat-card-value">{quizzes.length}</div>
                    <div className="stat-card-label">Total Quizzes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                        👥
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Students</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                        📚
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Resources</div>
                </div>
            </div>

            {/* Recent Quizzes */}
            <div>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Recent Quizzes</h2>
                    <Link to="/quizzes" className="btn btn-ghost">
                        View All →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="card">
                            <div className="card-body">
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
                                    <span className="badge badge-primary">{quiz.category?.name}</span>
                                    <span className="text-sm text-muted">
                                        {quiz.total_attempts} attempts
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                    {quiz.title}
                                </h3>
                                <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                                    {quiz.total_questions} questions • Avg: {quiz.average_score?.toFixed(1) || 0}%
                                </p>
                                <div className="flex gap-2">
                                    <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-secondary" style={{ flex: 1 }}>
                                        Edit
                                    </Link>
                                    <Link to={`/quizzes/${quiz.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                                        View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {quizzes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3 className="empty-state-title">No quizzes yet</h3>
                        <p className="empty-state-description">Create your first quiz to get started!</p>
                        {hasPermission('can_create_quizzes') && (
                            <Link to="/quizzes/create" className="btn btn-primary">
                                Create Quiz
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
