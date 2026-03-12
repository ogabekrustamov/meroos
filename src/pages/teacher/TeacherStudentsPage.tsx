import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts';
import { studentService, authService, quizService } from '../../services';
import type { StudentProfile, QuizAttempt } from '../../types';
import './TeacherStudentsPage.css';

// Types for the detail view
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

type ViewMode = 'list' | 'student' | 'attempt';

const TeacherStudentsPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Drill-down state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
    const [studentAttempts, setStudentAttempts] = useState<QuizAttempt[]>([]);
    const [loadingAttempts, setLoadingAttempts] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        class_group: '',
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const studentsData = await studentService.getStudents();
            setStudents(studentsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.register({
                username: formData.username,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: 'student'
            });
            setIsCreating(false);
            setFormData({ username: '', password: '', first_name: '', last_name: '', class_group: '' });
            alert('Student created successfully!');
            loadData();
        } catch (error) {
            alert('Failed to create student. Username might be taken.');
            console.error(error);
        }
    };

    const handleViewStudent = async (student: StudentProfile) => {
        setSelectedStudent(student);
        setViewMode('student');
        setLoadingAttempts(true);
        try {
            const attempts = await quizService.getStudentAttempts(student.student.id);
            setStudentAttempts(attempts);
        } catch (error) {
            console.error('Failed to load attempts:', error);
            setStudentAttempts([]);
        } finally {
            setLoadingAttempts(false);
        }
    };

    const handleViewAttempt = async (attempt: QuizAttempt) => {
        setLoadingDetail(true);
        setViewMode('attempt');
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
        if (viewMode === 'attempt') {
            setViewMode('student');
            setSelectedAttempt(null);
        } else {
            setViewMode('list');
            setSelectedStudent(null);
            setStudentAttempts([]);
        }
    };

    const filteredStudents = students.filter(s => {
        const q = searchQuery.toLowerCase();
        return (
            s.student.full_name.toLowerCase().includes(q) ||
            s.student.username.toLowerCase().includes(q) ||
            (s.class_group_name || '').toLowerCase().includes(q)
        );
    });

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

    const getInitials = (student: StudentProfile) => {
        const fn = student.student.first_name;
        const ln = student.student.last_name;
        if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
        if (fn) return fn[0].toUpperCase();
        return student.student.username[0].toUpperCase();
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    // ===================== ATTEMPT DETAIL VIEW =====================
    if (viewMode === 'attempt') {
        return (
            <div className="tsp-container">
                <button className="tsp-back-btn" onClick={handleBack}>
                    <span className="tsp-back-icon">←</span> Back to Test History
                </button>

                {loadingDetail ? (
                    <div className="tsp-loading-center">
                        <div className="spinner"></div>
                        <p>Loading attempt details...</p>
                    </div>
                ) : selectedAttempt ? (
                    <>
                        {/* Attempt header */}
                        <div className="tsp-attempt-header">
                            <div className="tsp-attempt-header-main">
                                <h2>{selectedAttempt.quiz_title}</h2>
                                <div className="tsp-attempt-meta">
                                    <span>📅 {formatDate(selectedAttempt.started_at)}</span>
                                    <span>⏱️ {formatDuration(selectedAttempt.time_taken)}</span>
                                    <span className={`tsp-badge ${selectedAttempt.passed ? 'tsp-badge-success' : 'tsp-badge-error'}`}>
                                        {selectedAttempt.passed ? '✅ Passed' : '❌ Failed'}
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

                        {/* Summary stats row */}
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

                        {/* Questions list */}
                        <h3 className="tsp-section-title">Question-by-Question Review</h3>
                        <div className="tsp-questions-list">
                            {selectedAttempt.answers.sort((a, b) => a.question_order - b.question_order).map((answer) => (
                                <div
                                    key={answer.id}
                                    className={`tsp-question-card ${answer.is_correct ? 'tsp-question-correct' : 'tsp-question-wrong'}`}
                                >
                                    <div className="tsp-question-header">
                                        <div className="tsp-question-number">
                                            {answer.is_correct ? '✅' : '❌'} Q{answer.question_order + 1}
                                        </div>
                                        <div className="tsp-question-points">
                                            {answer.points_earned}/{answer.points_possible} pts
                                            {answer.time_taken > 0 && (
                                                <span className="tsp-question-time">⏱ {answer.time_taken}s</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="tsp-question-text">{answer.question_text}</p>
                                    <div className="tsp-answer-comparison">
                                        <div className={`tsp-answer-box ${answer.is_correct ? 'tsp-answer-correct' : 'tsp-answer-wrong'}`}>
                                            <span className="tsp-answer-label">
                                                {answer.is_correct ? '✅ Your Answer (Correct)' : '❌ Your Answer'}
                                            </span>
                                            <span className="tsp-answer-value">
                                                {answer.selected_option_texts.length > 0
                                                    ? answer.selected_option_texts.join(', ')
                                                    : 'No answer selected'}
                                            </span>
                                        </div>
                                        {!answer.is_correct && (
                                            <div className="tsp-answer-box tsp-answer-correct">
                                                <span className="tsp-answer-label">✅ Correct Answer</span>
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
                        <span className="tsp-empty-icon">📋</span>
                        <p>Could not load attempt details.</p>
                    </div>
                )}
            </div>
        );
    }

    // ===================== STUDENT DETAIL VIEW =====================
    if (viewMode === 'student' && selectedStudent) {
        return (
            <div className="tsp-container">
                <button className="tsp-back-btn" onClick={handleBack}>
                    <span className="tsp-back-icon">←</span> Back to Students
                </button>

                {/* Student info header */}
                <div className="tsp-student-header">
                    <div className="tsp-student-header-avatar">
                        {selectedStudent.student.avatar ? (
                            <img src={selectedStudent.student.avatar} alt="" />
                        ) : (
                            <span>{getInitials(selectedStudent)}</span>
                        )}
                    </div>
                    <div className="tsp-student-header-info">
                        <h2>{selectedStudent.student.full_name}</h2>
                        <span className="tsp-student-username">@{selectedStudent.student.username}</span>
                        {selectedStudent.class_group_name && (
                            <span className="badge badge-primary" style={{ marginLeft: 8 }}>
                                {selectedStudent.class_group_name}
                            </span>
                        )}
                    </div>
                    <div className="tsp-student-header-stats">
                        <div className="tsp-header-stat">
                            <span className="tsp-header-stat-value">{selectedStudent.total_quizzes_taken}</span>
                            <span className="tsp-header-stat-label">Tests Taken</span>
                        </div>
                        <div className="tsp-header-stat">
                            <span className="tsp-header-stat-value">{selectedStudent.average_score}%</span>
                            <span className="tsp-header-stat-label">Avg Score</span>
                        </div>
                        <div className="tsp-header-stat">
                            <span className="tsp-header-stat-value">{selectedStudent.current_streak} 🔥</span>
                            <span className="tsp-header-stat-label">Streak</span>
                        </div>
                    </div>
                </div>

                {/* Test history */}
                <h3 className="tsp-section-title">Test History</h3>

                {loadingAttempts ? (
                    <div className="tsp-loading-center">
                        <div className="spinner"></div>
                        <p>Loading test history...</p>
                    </div>
                ) : studentAttempts.length > 0 ? (
                    <div className="tsp-attempts-list">
                        {studentAttempts.map((attempt) => (
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
                        <span className="tsp-empty-icon">📝</span>
                        <p>No test attempts found for this student.</p>
                    </div>
                )}
            </div>
        );
    }

    // ===================== STUDENT LIST VIEW =====================
    return (
        <div className="tsp-container">
            {/* Page header */}
            <div className="tsp-page-header">
                <div className="tsp-page-header-content">
                    <div>
                        <h1 className="tsp-page-title">My Students</h1>
                        <p className="tsp-page-subtitle">{students.length} students enrolled</p>
                    </div>
                    <div className="tsp-page-header-actions">
                        <div className="tsp-search-box">
                            <span className="tsp-search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="tsp-search-input"
                            />
                        </div>
                        {hasPermission('can_create_students') && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsCreating(!isCreating)}
                            >
                                {isCreating ? '✕ Cancel' : '+ Register Student'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Registration form modal */}
            {isCreating && (
                <div className="tsp-register-overlay" onClick={() => setIsCreating(false)}>
                    <div className="tsp-register-modal" onClick={e => e.stopPropagation()}>
                        <div className="tsp-register-header">
                            <h2>Register New Student</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setIsCreating(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="tsp-register-form">
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">First Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    placeholder="First name"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Last Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    placeholder="Last name"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Register Student
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Student cards grid */}
            <div className="tsp-students-grid">
                {filteredStudents.map(student => (
                    <div
                        key={student.id}
                        className="tsp-student-card"
                        onClick={() => handleViewStudent(student)}
                    >
                        <div className="tsp-card-accent" />
                        <div className="tsp-card-content">
                            <div className="tsp-card-top">
                                <div className="tsp-card-avatar">
                                    {student.student.avatar ? (
                                        <img src={student.student.avatar} alt="" />
                                    ) : (
                                        <span>{getInitials(student)}</span>
                                    )}
                                </div>
                                <div className="tsp-card-info">
                                    <h4 className="tsp-card-name">{student.student.full_name}</h4>
                                    <span className="tsp-card-username">@{student.student.username}</span>
                                </div>
                            </div>
                            {student.class_group_name && (
                                <span className="tsp-card-class">{student.class_group_name}</span>
                            )}
                            <div className="tsp-card-stats">
                                <div className="tsp-card-stat">
                                    <span className="tsp-card-stat-value">{student.average_score}%</span>
                                    <span className="tsp-card-stat-label">Avg Score</span>
                                    <div className="tsp-card-progress">
                                        <div
                                            className="tsp-card-progress-fill"
                                            style={{
                                                width: `${student.average_score}%`,
                                                background: getScoreColor(student.average_score),
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="tsp-card-stat-row">
                                    <div className="tsp-card-stat-mini">
                                        <span className="tsp-card-stat-mini-value">{student.total_quizzes_taken}</span>
                                        <span className="tsp-card-stat-mini-label">Tests</span>
                                    </div>
                                    <div className="tsp-card-stat-mini">
                                        <span className="tsp-card-stat-mini-value">{student.current_streak} 🔥</span>
                                        <span className="tsp-card-stat-mini-label">Streak</span>
                                    </div>
                                    <div className="tsp-card-stat-mini">
                                        <span className="tsp-card-stat-mini-value">{student.last_activity_date ? new Date(student.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</span>
                                        <span className="tsp-card-stat-mini-label">Last Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="tsp-card-footer">
                                <span className="tsp-card-view-btn">View Performance →</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredStudents.length === 0 && (
                    <div className="tsp-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <span className="tsp-empty-icon">👨‍🎓</span>
                        <p>{searchQuery ? 'No students match your search.' : 'No students found.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherStudentsPage;
