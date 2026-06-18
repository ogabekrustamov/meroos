import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FilePlus, Gamepad2, Upload, BarChart3, School, GraduationCap,
    ClipboardList, Users, BookOpen, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import WelcomeAnimation from '../../components/common/WelcomeAnimation';
import { quizService } from '../../services';
import type { Quiz } from '../../types';

const TeacherDashboard: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const { t } = useTranslation();
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
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-8)',
                    marginBottom: 'var(--space-8)',
                    color: 'white',
                }}
            >
                <WelcomeAnimation variant="teacher" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                        {t('dashboard.teacher.greeting', { name: user?.first_name || user?.username })}
                    </h1>
                    <p style={{ opacity: 0.9 }}>
                        {t('dashboard.teacher.subtitle')}
                    </p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    {t('dashboard.teacher.quickActions')}
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
                                    <FilePlus size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.createQuiz')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.createQuizDesc')}</p>
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
                                    <Gamepad2 size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.hostKahoot')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.hostKahootDesc')}</p>
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
                                    <Upload size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.uploadResource')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.uploadResourceDesc')}</p>
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
                                        background: 'var(--gradient-accent)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    <BarChart3 size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.classStats')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.classStatsDesc')}</p>
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
                                        background: 'var(--gradient-primary)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    <School size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.myClasses')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.myClassesDesc')}</p>
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
                                        background: 'var(--gradient-secondary)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    <GraduationCap size={28} strokeWidth={1.85} />
                                </div>
                                <h3 className="font-semibold">{t('dashboard.teacher.students')}</h3>
                                <p className="text-sm text-secondary">{t('dashboard.teacher.studentsDesc')}</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card">
                    <div className="stat-card-icon"><ClipboardList size={24} strokeWidth={1.85} /></div>
                    <div className="stat-card-value">{quizzes.length}</div>
                    <div className="stat-card-label">{t('dashboard.teacher.totalQuizzes')}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                        <Users size={24} strokeWidth={1.85} />
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">{t('dashboard.teacher.studentsLabel')}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                        <BookOpen size={24} strokeWidth={1.85} />
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">{t('dashboard.teacher.resourcesLabel')}</div>
                </div>
            </div>

            {/* Recent Quizzes */}
            <div>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{t('dashboard.teacher.recentQuizzes')}</h2>
                    <Link to="/quizzes" className="btn btn-ghost">
                        {t('common.viewAll')} →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="card">
                            <div className="card-body">
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
                                    <span className="badge badge-primary">{quiz.category?.name}</span>
                                    <span className="text-sm text-muted">
                                        {t('dashboard.teacher.attempts', { count: quiz.total_attempts })}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                    {quiz.title}
                                </h3>
                                <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                                    {t('dashboard.teacher.questionsAvg', { count: quiz.total_questions, avg: quiz.average_score?.toFixed(1) || 0 })}
                                </p>
                                <div className="flex gap-2">
                                    <Link to={`/quizzes/${quiz.id}/edit`} className="btn btn-secondary" style={{ flex: 1 }}>
                                        {t('common.edit')}
                                    </Link>
                                    <Link to={`/quizzes/${quiz.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                                        {t('common.view')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {quizzes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FileText size={64} strokeWidth={1.75} /></div>
                        <h3 className="empty-state-title">{t('dashboard.teacher.noQuizzes')}</h3>
                        <p className="empty-state-description">{t('dashboard.teacher.noQuizzesDesc')}</p>
                        {hasPermission('can_create_quizzes') && (
                            <Link to="/quizzes/create" className="btn btn-primary">
                                {t('dashboard.teacher.createQuiz')}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
