import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, ClipboardList, FileText } from 'lucide-react';
import { quizService } from '../../services';
import type { QuizAttempt } from '../../types';
import '../teacher/TeacherStudentsPage.css';

interface QuizAnswerDetail {
    id: number;
    question_text: string;
    question_order: number;
    question_type: string;
    is_correct: boolean;
    points_earned: number;
    points_possible: number;
    time_taken: number;
    selected_option_texts: string[];
    correct_option_texts: string[];
}

interface QuizAttemptDetail extends QuizAttempt {
    quiz_title: string;
    total_questions: number;
    answers: QuizAnswerDetail[];
}

const StudentQuizHistoryPage: React.FC = () => {
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    useEffect(() => {
        loadAttempts();
    }, []);

    const loadAttempts = async () => {
        try {
            setLoading(true);
            const data = await quizService.getMyAttempts();
            setAttempts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load attempts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewAttempt = async (attempt: QuizAttempt) => {
        setLoadingDetail(true);
        setViewMode('detail');
        try {
            const detail = await quizService.getAttemptDetail(attempt.attempt_id);
            setSelectedAttempt(detail);
        } catch (error) {
            console.error('Failed to load attempt detail:', error);
            setSelectedAttempt(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedAttempt(null);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '—';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getScoreColor = (pct?: number) => {
        if (!pct && pct !== 0) return 'var(--color-gray-400)';
        if (pct >= 80) return 'var(--color-success-500)';
        if (pct >= 60) return 'var(--color-warning-500)';
        return 'var(--color-error-500)';
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    // ================ ATTEMPT DETAIL ================
    if (viewMode === 'detail') {
        return (
            <div className="tsp-container">
                <button className="tsp-back-btn" onClick={handleBack}>
                    <span className="tsp-back-icon">←</span> Back to My Tests
                </button>

                {loadingDetail ? (
                    <div className="tsp-loading-center">
                        <div className="spinner"></div>
                        <p>Loading test details...</p>
                    </div>
                ) : selectedAttempt ? (
                    <>
                        <div className="tsp-attempt-header">
                            <div className="tsp-attempt-header-main">
                                <h2>{selectedAttempt.quiz_title}</h2>
                                <div className="tsp-attempt-meta">
                                    <span><Calendar size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {formatDate(selectedAttempt.started_at)}</span>
                                    <span><Clock size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {formatDuration(selectedAttempt.time_taken)}</span>
                                    <span className={`tsp-badge ${selectedAttempt.passed ? 'tsp-badge-success' : 'tsp-badge-error'}`}>
                                        {selectedAttempt.passed
                                            ? <><CheckCircle size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> Passed</>
                                            : <><XCircle size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> Failed</>}
                                    </span>
                                </div>
                            </div>
                            <div className="tsp-attempt-score-ring" style={{ '--score-color': getScoreColor(selectedAttempt.score_percentage) } as React.CSSProperties}>
                                <svg viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" className="tsp-ring-bg" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        className="tsp-ring-fill"
                                        strokeDasharray={`${(selectedAttempt.score_percentage || 0) * 3.267} 326.7`}
                                    />
                                </svg>
                                <div className="tsp-ring-text">
                                    <span className="tsp-ring-value">{Math.round(selectedAttempt.score_percentage || 0)}%</span>
                                    <span className="tsp-ring-label">Score</span>
                                </div>
                            </div>
                        </div>

                        <div className="tsp-attempt-stats-row">
                            <div className="tsp-mini-stat">
                                <span className="tsp-mini-stat-value">{selectedAttempt.score}/{selectedAttempt.max_score}</span>
                                <span className="tsp-mini-stat-label">Points</span>
                            </div>
                            <div className="tsp-mini-stat">
                                <span className="tsp-mini-stat-value">
                                    {selectedAttempt.answers.filter(a => a.is_correct).length}/{selectedAttempt.total_questions}
                                </span>
                                <span className="tsp-mini-stat-label">Correct</span>
                            </div>
                            <div className="tsp-mini-stat">
                                <span className="tsp-mini-stat-value">{formatDuration(selectedAttempt.time_taken)}</span>
                                <span className="tsp-mini-stat-label">Time</span>
                            </div>
                        </div>

                        <h3 className="tsp-section-title">Question-by-Question Review</h3>
                        <div className="tsp-questions-list">
                            {selectedAttempt.answers.sort((a, b) => a.question_order - b.question_order).map((answer) => (
                                <div
                                    key={answer.id}
                                    className={`tsp-question-card ${answer.is_correct ? 'tsp-question-correct' : 'tsp-question-wrong'}`}
                                >
                                    <div className="tsp-question-header">
                                        <div className="tsp-question-number">
                                            {answer.is_correct
                                                ? <CheckCircle size={16} strokeWidth={1.85} color="var(--jade)" style={{ verticalAlign: 'text-bottom' }} />
                                                : <XCircle size={16} strokeWidth={1.85} color="var(--shape-red)" style={{ verticalAlign: 'text-bottom' }} />} Q{answer.question_order + 1}
                                        </div>
                                        <div className="tsp-question-points">
                                            {answer.points_earned}/{answer.points_possible} pts
                                            {answer.time_taken > 0 && (
                                                <span className="tsp-question-time"><Clock size={13} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {answer.time_taken}s</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="tsp-question-text">{answer.question_text}</p>
                                    <div className="tsp-answer-comparison">
                                        <div className={`tsp-answer-box ${answer.is_correct ? 'tsp-answer-correct' : 'tsp-answer-wrong'}`}>
                                            <span className="tsp-answer-label">
                                                {answer.is_correct
                                                    ? <><CheckCircle size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> Your Answer (Correct)</>
                                                    : <><XCircle size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> Your Answer</>}
                                            </span>
                                            <span className="tsp-answer-value">
                                                {answer.selected_option_texts.length > 0
                                                    ? answer.selected_option_texts.join(', ')
                                                    : 'No answer selected'}
                                            </span>
                                        </div>
                                        {!answer.is_correct && (
                                            <div className="tsp-answer-box tsp-answer-correct">
                                                <span className="tsp-answer-label"><CheckCircle size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> Correct Answer</span>
                                                <span className="tsp-answer-value">
                                                    {answer.correct_option_texts.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="tsp-empty-state">
                        <span className="tsp-empty-icon"><ClipboardList size={48} strokeWidth={1.75} /></span>
                        <p>Could not load test details.</p>
                    </div>
                )}
            </div>
        );
    }

    // ================ ATTEMPTS LIST ================
    return (
        <div className="tsp-container">
            <div className="tsp-page-header">
                <div className="tsp-page-header-content">
                    <div>
                        <h1 className="tsp-page-title">My Quiz History</h1>
                        <p className="tsp-page-subtitle">{attempts.length} tests taken</p>
                    </div>
                </div>
            </div>

            {attempts.length > 0 ? (
                <div className="tsp-attempts-list">
                    {attempts.map((attempt) => (
                        <div
                            key={attempt.attempt_id}
                            className="tsp-attempt-card"
                            onClick={() => handleViewAttempt(attempt)}
                        >
                            <div className="tsp-attempt-card-left">
                                <div
                                    className="tsp-attempt-score-bar"
                                    style={{
                                        '--score-width': `${attempt.score_percentage || 0}%`,
                                        '--score-color': getScoreColor(attempt.score_percentage),
                                    } as React.CSSProperties}
                                />
                                <div className="tsp-attempt-card-info">
                                    <span className="tsp-attempt-quiz-name">
                                        {(attempt as any).quiz_title || `Quiz #${(attempt as any).quiz}`}
                                    </span>
                                    <span className="tsp-attempt-date">
                                        {formatDate(attempt.started_at)}
                                        {attempt.completed_at && ` — Finished ${formatDate(attempt.completed_at)}`}
                                    </span>
                                </div>
                            </div>
                            <div className="tsp-attempt-card-right">
                                <span
                                    className="tsp-attempt-score"
                                    style={{ color: getScoreColor(attempt.score_percentage) }}
                                >
                                    {Math.round(attempt.score_percentage || 0)}%
                                </span>
                                <span className={`tsp-badge ${attempt.passed ? 'tsp-badge-success' : 'tsp-badge-error'}`}>
                                    {attempt.passed ? 'Passed' : 'Failed'}
                                </span>
                                <span className="tsp-attempt-time">{formatDuration(attempt.time_taken)}</span>
                                <span className="tsp-attempt-arrow">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="tsp-empty-state">
                    <span className="tsp-empty-icon"><FileText size={48} strokeWidth={1.75} /></span>
                    <p>You haven't taken any tests yet. Head to the quizzes page to get started!</p>
                </div>
            )}
        </div>
    );
};

export default StudentQuizHistoryPage;
