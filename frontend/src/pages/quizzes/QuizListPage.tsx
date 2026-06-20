import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PartyPopper, Dumbbell, ClipboardList, Clock, Pencil, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '../../contexts';
import { quizService, resourceService } from '../../services';
import type { Quiz, ResourceCategory } from '../../types';

const QuizListPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const location = useLocation();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
    const [resultData, setResultData] = useState<{ score: number; total: number; passed: boolean } | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Categories are filter options — load once.
    useEffect(() => {
        resourceService.getCategories()
            .then((categoriesData) => {
                const cats = categoriesData as ResourceCategory[] | { results: ResourceCategory[] };
                setCategories(Array.isArray(cats) ? cats : (cats.results || []));
            })
            .catch((error) => console.error('Failed to fetch categories:', error));
    }, []);

    const fetchQuizzes = async (pageNum: number, append: boolean) => {
        if (append) setLoadingMore(true); else setLoading(true);
        try {
            const data = await quizService.getQuizzes({
                category: selectedCategory,
                difficulty: selectedDifficulty,
                page: pageNum,
            });
            const results = data.results || [];
            setQuizzes((prev) => (append ? [...prev, ...results] : results));
            setHasMore(Boolean(data.next));
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
        }
    };

    // Reload from page 1 whenever the filters change.
    useEffect(() => {
        fetchQuizzes(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                {resultData.passed ? <PartyPopper size={44} strokeWidth={1.75} color="var(--jade)" /> : <Dumbbell size={44} strokeWidth={1.75} color="var(--marigold)" />}
                            </div>
                            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
                                {resultData.passed ? t('quiz.list.quizPassed') : t('quiz.list.niceTry')}
                            </h2>
                            <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
                                {t('quiz.list.scoredOutOf', { score: resultData.score, total: resultData.total })}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeResultModal}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {t('quiz.list.continue')}
                                </button>
                                <Link
                                    to="/leaderboard"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    {t('quiz.list.viewLeaderboard')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                    <h1 className="page-title">{t('quiz.list.title')}</h1>
                    <p className="text-secondary">{t('quiz.list.subtitle')}</p>
                </div>
                {canCreateQuiz && (
                    <Link to="/quizzes/create" className="btn btn-primary">
                        {t('quiz.list.createQuiz')}
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <select
                    className="input"
                    style={{ width: 'auto', minWidth: '180px' }}
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                >
                    <option value="">{t('quiz.list.allCategories')}</option>
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
                    <option value="">{t('quiz.list.allDifficulties')}</option>
                    <option value="easy">{t('difficulty.easy')}</option>
                    <option value="medium">{t('difficulty.medium')}</option>
                    <option value="hard">{t('difficulty.hard')}</option>
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
                                    {t(`difficulty.${quiz.difficulty}`)}
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
                                {quiz.description || t('quiz.list.noDescription')}
                            </p>

                            <div className="flex gap-4 text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                <span><ClipboardList size={15} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('common.questionsCount', { count: quiz.total_questions })}</span>
                                <span><Clock size={15} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('quiz.list.secEach', { count: quiz.time_per_question || 30 })}</span>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/quizzes/${quiz.id}`}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {t('common.startQuiz')}
                                </Link>
                                {(user?.role === 'superuser' || hasPermission('can_edit_quizzes')) && (
                                    <Link
                                        to={`/quizzes/${quiz.id}/edit`}
                                        className="btn btn-secondary"
                                        title={t('quiz.list.editQuiz')}
                                    >
                                        <Pencil size={18} strokeWidth={1.85} />
                                    </Link>
                                )}
                                {(user?.role === 'superuser' || hasPermission('can_delete_quizzes')) && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ color: 'var(--error)' }}
                                        title={t('quiz.list.deleteQuiz')}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            if (window.confirm(t('quiz.list.deleteConfirm', { title: quiz.title }))) {
                                                try {
                                                    await quizService.deleteQuiz(quiz.id);
                                                    setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
                                                } catch (err) {
                                                    console.error('Failed to delete quiz:', err);
                                                    toast.error(t('quiz.list.deleteFailed'));
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={18} strokeWidth={1.85} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                    <button className="btn btn-secondary" onClick={() => fetchQuizzes(page + 1, true)} disabled={loadingMore}>
                        {loadingMore ? t('common.loading') : t('common.loadMore')}
                    </button>
                </div>
            )}

            {quizzes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon"><FileText size={64} strokeWidth={1.75} /></div>
                    <h3 className="empty-state-title">{t('quiz.list.noQuizzesFound')}</h3>
                    <p className="empty-state-description">
                        {selectedCategory || selectedDifficulty
                            ? t('quiz.list.adjustFilters')
                            : t('quiz.list.checkBackLater')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuizListPage;
