import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { quizService, resourceService } from '../../services';
import type { Quiz, ResourceCategory } from '../../types';

const QuizListPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const location = useLocation();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
    const [resultData, setResultData] = useState<{ score: number; total: number; passed: boolean } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [quizzesData, categoriesData] = await Promise.all([
                    quizService.getQuizzes({
                        category: selectedCategory,
                        difficulty: selectedDifficulty,
                    }),
                    resourceService.getCategories(),
                ]);
                setQuizzes(quizzesData.results || []);
                // Handle both array and paginated response formats
                const cats = categoriesData as ResourceCategory[] | { results: ResourceCategory[] };
                setCategories(Array.isArray(cats) ? cats : (cats.results || []));
            } catch (error) {
                console.error('Failed to fetch quizzes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, selectedDifficulty]);

    useEffect(() => {
        if (location.state && location.state.score !== undefined) {
            setResultData(location.state);
            // Clear state history so refresh doesn't show it again
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const canCreateQuiz = user?.role === 'superuser' || (user?.role === 'teacher' && hasPermission('can_create_quizzes'));

    const closeResultModal = () => setResultData(null);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Result Modal */}
            {resultData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%', animation: 'slideUp 0.3s ease-out' }}>
                        <div className="card-body text-center">
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>
                                {resultData.passed ? '🎉' : '💪'}
                            </div>
                            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
                                {resultData.passed ? 'Quiz Passed!' : 'Nice Try!'}
                            </h2>
                            <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
                                You scored <strong>{resultData.score}</strong> out of <strong>{resultData.total}</strong> points
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeResultModal}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Continue
                                </button>
                                <Link
                                    to="/leaderboard"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    View Leaderboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title">Quizzes</h1>
                    <p className="text-secondary">Test your knowledge with our interactive quizzes</p>
                </div>
                {canCreateQuiz && (
                    <Link to="/quizzes/create" className="btn btn-primary">
                        + Create Quiz
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4" style={{ marginBottom: 'var(--space-6)' }}>
                <select
                    className="input"
                    style={{ width: 'auto', minWidth: '180px' }}
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    className="input"
                    style={{ width: 'auto', minWidth: '150px' }}
                    value={selectedDifficulty || ''}
                    onChange={(e) => setSelectedDifficulty(e.target.value || undefined)}
                >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            {/* Quiz Grid */}
            <div className="grid grid-cols-3 gap-6">
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

                            <p className="text-secondary text-sm" style={{
                                marginBottom: 'var(--space-4)',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}>
                                {quiz.description || 'No description available'}
                            </p>

                            <div className="flex gap-4 text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                <span>📝 {quiz.total_questions} questions</span>
                                <span>⏱️ {quiz.time_per_question || 30}s each</span>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/quizzes/${quiz.id}`}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Start Quiz
                                </Link>
                                {(user?.role === 'superuser' || hasPermission('can_edit_quizzes')) && (
                                    <Link
                                        to={`/quizzes/${quiz.id}/edit`}
                                        className="btn btn-secondary"
                                        title="Edit Quiz"
                                    >
                                        ✏️
                                    </Link>
                                )}
                                {(user?.role === 'superuser' || hasPermission('can_delete_quizzes')) && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ color: 'var(--error)' }}
                                        title="Delete Quiz"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            if (window.confirm(`Delete "${quiz.title}"? This action cannot be undone.`)) {
                                                try {
                                                    await quizService.deleteQuiz(quiz.id);
                                                    setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
                                                } catch (err) {
                                                    console.error('Failed to delete quiz:', err);
                                                    alert('Failed to delete quiz');
                                                }
                                            }
                                        }}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {quizzes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3 className="empty-state-title">No quizzes found</h3>
                    <p className="empty-state-description">
                        {selectedCategory || selectedDifficulty
                            ? 'Try adjusting your filters'
                            : 'Check back later for new quizzes!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuizListPage;
