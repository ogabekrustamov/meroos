import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quizService, resourceService } from '../../services';
import type { Quiz, Resource } from '../../types';

const GuestDashboard: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [quizzesData, resourcesData] = await Promise.all([
                    quizService.getQuizzes({ page: 1 }),
                    resourceService.getResources({ page: 1 }),
                ]);
                setQuizzes(quizzesData.results.slice(0, 4));
                setResources(resourcesData.results.slice(0, 4));
            } catch (error) {
                console.error('Failed to fetch data:', error);
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
                    Welcome to Meroos! 🎓
                </h1>
                <p style={{ opacity: 0.9, marginBottom: 'var(--space-4)' }}>
                    Explore quizzes and resources. Sign in to track your progress and compete on leaderboards!
                </p>
                <Link
                    to="/login"
                    className="btn"
                    style={{
                        background: 'white',
                        color: 'var(--color-primary-600)',
                    }}
                >
                    Sign In for Full Access
                </Link>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    What would you like to do?
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    <Link to="/quizzes" className="card" style={{ textDecoration: 'none' }}>
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
                            <h3 className="font-semibold">Take Quizzes</h3>
                            <p className="text-sm text-secondary">Test your knowledge</p>
                        </div>
                    </Link>

                    <Link to="/kahoot/join" className="card" style={{ textDecoration: 'none' }}>
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
                            <h3 className="font-semibold">Join Kahoot</h3>
                            <p className="text-sm text-secondary">Play live with others</p>
                        </div>
                    </Link>

                    <Link to="/resources" className="card" style={{ textDecoration: 'none' }}>
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
                            <h3 className="font-semibold">Resources</h3>
                            <p className="text-sm text-secondary">Browse learning materials</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Available Quizzes */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Featured Quizzes</h2>
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
                                    <span className={`badge ${quiz.difficulty === 'easy' ? 'badge-success' :
                                        quiz.difficulty === 'medium' ? 'badge-warning' : 'badge-error'
                                        }`}>
                                        {quiz.difficulty}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                    {quiz.title}
                                </h3>
                                <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                                    {quiz.total_questions} questions
                                </p>
                                <Link to={`/quizzes/${quiz.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                                    Start Quiz
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources Preview */}
            <div>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Learning Resources</h2>
                    <Link to="/resources" className="btn btn-ghost">
                        View All →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {resources.map((resource) => (
                        <div key={resource.id} className="card">
                            <div className="card-body">
                                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                                    <span style={{ fontSize: '1.5rem' }}>
                                        {resource.resource_type === 'video' ? '🎥' :
                                            resource.resource_type === 'pdf' ? '📄' :
                                                resource.resource_type === 'link' ? '🔗' : '📁'}
                                    </span>
                                    <span className="badge badge-secondary">{resource.category?.name}</span>
                                </div>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                    {resource.title}
                                </h3>
                                <p className="text-secondary text-sm" style={{
                                    marginBottom: 'var(--space-4)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {resource.description}
                                </p>
                                <Link to={`/resources/${resource.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                                    View Resource
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
