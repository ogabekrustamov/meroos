import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services';
import type { Quiz, QuizQuestion, QuizAttempt, AnswerSubmitResponse } from '../../types';

const QuizTakePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<AnswerSubmitResponse | null>(null);
    const [score, setScore] = useState(0);

    // Load quiz and start attempt
    useEffect(() => {
        const loadQuiz = async () => {
            if (!id) return;
            try {
                const quizData = await quizService.getQuiz(Number(id));
                setQuiz(quizData);
                const attemptData = await quizService.startAttempt(Number(id));
                setAttempt(attemptData);
                setTimeLeft(quizData.time_per_question || 30);
            } catch (error) {
                console.error('Failed to load quiz:', error);
                navigate('/quizzes');
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [id, navigate]);

    // Timer countdown
    useEffect(() => {
        if (!quiz || showResult) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmitAnswer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [quiz, currentQuestionIndex, showResult]);

    const currentQuestion: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex];

    const handleOptionSelect = (optionId: number) => {
        if (showResult) return;

        if (currentQuestion?.question_type === 'multiple') {
            setSelectedOptions((prev) =>
                prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptions([optionId]);
        }
    };

    const handleSubmitAnswer = useCallback(async () => {
        if (!attempt || !currentQuestion || submitting) return;

        setSubmitting(true);
        try {
            const timeTaken = (quiz?.time_per_question || 30) - timeLeft;
            const result = await quizService.submitAnswer(
                attempt.attempt_id,
                currentQuestion.id,
                selectedOptions,
                timeTaken
            );
            setLastResult(result);
            setScore((prev) => prev + result.points_earned);
            setShowResult(true);
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setSubmitting(false);
        }
    }, [attempt, currentQuestion, selectedOptions, timeLeft, quiz, submitting]);

    const handleNextQuestion = async () => {
        if (!quiz?.questions) return;

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedOptions([]);
            setShowResult(false);
            setLastResult(null);
            setTimeLeft(quiz.time_per_question || 30);
        } else {
            // Complete the quiz
            if (attempt) {
                await quizService.completeAttempt(attempt.attempt_id);
            }
            navigate('/quizzes', {
                state: { score, total: quiz.total_points, passed: score >= (quiz.passing_score || 0) },
            });
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
                <p className="text-secondary">Loading quiz...</p>
            </div>
        );
    }

    if (!quiz || !currentQuestion) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3 className="empty-state-title">Quiz not found</h3>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / (quiz.questions?.length || 1)) * 100;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Progress Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
                    <span className="text-sm text-secondary">
                        Question {currentQuestionIndex + 1} of {quiz.questions?.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Score: {score}</span>
                        <div
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                background: timeLeft <= 5 ? 'var(--color-error-500)' : 'var(--gradient-primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-full)',
                                fontWeight: 'bold',
                                minWidth: '60px',
                                textAlign: 'center',
                            }}
                        >
                            {timeLeft}s
                        </div>
                    </div>
                </div>
                <div className="progress">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                        <span className="badge badge-primary">{currentQuestion.points} points</span>
                        <span className="badge badge-secondary">
                            {currentQuestion.question_type === 'single' ? 'Single choice' :
                                currentQuestion.question_type === 'multiple' ? 'Multiple choice' : 'True/False'}
                        </span>
                    </div>

                    <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)' }}>
                        {currentQuestion.question_text}
                    </h2>

                    {currentQuestion.image && (
                        <img
                            src={currentQuestion.image}
                            alt="Question"
                            style={{
                                maxWidth: '100%',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-6)',
                            }}
                        />
                    )}

                    {/* Options */}
                    <div className="flex flex-col gap-3">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOptions.includes(option.id);
                            const isCorrect = showResult && lastResult?.correct_options?.includes(option.id);
                            const isWrong = showResult && isSelected && !isCorrect;
                            const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(option.id)}
                                    disabled={showResult}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4) var(--space-5)',
                                        background: isCorrect
                                            ? 'var(--color-success-50)'
                                            : isWrong
                                                ? 'var(--color-error-50)'
                                                : isSelected
                                                    ? 'var(--color-primary-50)'
                                                    : 'var(--color-surface)',
                                        border: `2px solid ${isCorrect
                                            ? 'var(--color-success-500)'
                                            : isWrong
                                                ? 'var(--color-error-500)'
                                                : isSelected
                                                    ? 'var(--color-primary-500)'
                                                    : 'var(--color-border)'
                                            }`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: showResult ? 'default' : 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        textAlign: 'left',
                                        width: '100%',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-md)',
                                            background: colors[index % 4],
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span style={{ flex: 1 }}>{option.option_text}</span>
                                    {showResult && isCorrect && <span>✅</span>}
                                    {showResult && isWrong && <span>❌</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Result / Submit */}
            {showResult ? (
                <div>
                    <div
                        className="card"
                        style={{
                            background: lastResult?.is_correct ? 'var(--color-success-50)' : 'var(--color-error-50)',
                            border: `1px solid ${lastResult?.is_correct ? 'var(--color-success-500)' : 'var(--color-error-500)'}`,
                            marginBottom: 'var(--space-4)',
                        }}
                    >
                        <div className="card-body text-center">
                            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
                                {lastResult?.is_correct ? '🎉' : '😔'}
                            </div>
                            <h3 style={{ marginBottom: 'var(--space-2)' }}>
                                {lastResult?.is_correct ? 'Correct!' : 'Incorrect'}
                            </h3>
                            <p className="text-secondary">
                                +{lastResult?.points_earned} points
                            </p>
                            {lastResult?.explanation && (
                                <p style={{ marginTop: 'var(--space-3)' }}>{lastResult.explanation}</p>
                            )}
                        </div>
                    </div>

                    <button onClick={handleNextQuestion} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                        {currentQuestionIndex < (quiz.questions?.length || 0) - 1 ? 'Next Question →' : 'Finish Quiz'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOptions.length === 0 || submitting}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
            )}
        </div>
    );
};

export default QuizTakePage;
