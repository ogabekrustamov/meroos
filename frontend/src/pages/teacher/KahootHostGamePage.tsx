import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, PartyPopper, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { quizService, getAccessToken } from '../../services';
import { BACKEND_URL, wsUrl } from '../../config';
import './kahoot-host.css';

// Define types for WS events
interface QuestionData {
    id: number;
    text: string;
    image: string | null;
    type: string;
    points: number;
    time_limit: number;
    options: any[];
    question_number: number;
    total_questions: number;
}

interface QuestionStats {
    question_id: number;
    total_answers: number;
    option_stats: {
        option_id: number;
        text: string;
        is_correct: boolean;
        count: number;
    }[];
    correct_option_ids: number[];
}

const getImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
};

// Answer block colors matching the Kahoot quiz shapes (project --shape-* tokens)
const ANSWER_COLORS = [
    { cls: 'kh-c-red', icon: '▲' },
    { cls: 'kh-c-blue', icon: '◆' },
    { cls: 'kh-c-gold', icon: '●' },
    { cls: 'kh-c-green', icon: '■' },
];

const KahootHostGamePage: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [gameState, setGameState] = useState<'loading' | 'question' | 'results' | 'leaderboard' | 'finished'>('loading');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answersCount, setAnswersCount] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!roomCode) return;
        let mounted = true;
        let wsConnection: WebSocket | null = null;

        const connectWebSocket = () => {
            // JWT goes in the query string so the backend JWTAuthMiddleware can
            // authenticate the socket (?token=<access>); otherwise it's rejected.
            const token = getAccessToken();
            wsConnection = new WebSocket(
                wsUrl(`/ws/kahoot/${roomCode}/${token ? `?token=${encodeURIComponent(token)}` : ''}`)
            );

            wsConnection.onopen = async () => {
                if (!mounted) { wsConnection?.close(); return; }
                ws.current = wsConnection;
                try {
                    const roomData = await quizService.getKahootRoom(roomCode);
                    if (roomData.status === 'completed') setGameState('finished');
                } catch (error) {
                    console.error('Failed to fetch room state:', error);
                }
            };

            wsConnection.onmessage = (event) => {
                if (!mounted) return;
                handleWsMessage(JSON.parse(event.data));
            };

            wsConnection.onclose = () => {
                if (!mounted) return;
                setTimeout(() => {
                    if (mounted && (!ws.current || ws.current.readyState === WebSocket.CLOSED)) {
                        connectWebSocket();
                    }
                }, 2000);
            };

            wsConnection.onerror = (error) => console.error('WebSocket error:', error);
        };

        connectWebSocket();
        return () => {
            mounted = false;
            if (timerRef.current) clearInterval(timerRef.current);
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) wsConnection.close();
        };
    }, [roomCode]);

    useEffect(() => {
        if (gameState === 'question' && timeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, timeLeft]);

    const handleWsMessage = (data: any) => {
        switch (data.type) {
            case 'quiz_started':
            case 'next_question':
                setGameState('question');
                setCurrentQuestion(data.question);
                setTimeLeft(data.question?.time_limit || 30);
                setAnswersCount(0);
                setQuestionStats(null);
                break;
            case 'question_results':
                setGameState('results');
                setQuestionStats(data.stats);
                break;
            case 'leaderboard_update':
                if (data.is_interim) {
                    setGameState('leaderboard');
                    setLeaderboard(data.leaderboard);
                } else if (data.answer_submitted) {
                    setAnswersCount(prev => prev + 1);
                }
                break;
            case 'quiz_ended':
                setGameState('finished');
                setLeaderboard(data.results?.leaderboard || []);
                break;
        }
    };

    const sendWsMessage = (type: string, payload: any = {}) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }
        const token = localStorage.getItem('meroos_access_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                payload.user_id = JSON.parse(jsonPayload).user_id;
            } catch (e) { console.error('JWT decode error:', e); }
        }
        ws.current.send(JSON.stringify({ type, ...payload }));
    };

    const handleTimeUp = () => sendWsMessage('show_question_results');

    const handleNext = () => {
        if (gameState === 'question') sendWsMessage('show_question_results');
        else if (gameState === 'results') sendWsMessage('show_leaderboard');
        else if (gameState === 'leaderboard') sendWsMessage('next_question');
    };

    const handleEndGame = () => {
        if (confirm(t('kahoot.game.endConfirm'))) sendWsMessage('end_quiz');
    };

    // Timer progress drives the ring animation (r=46 → circumference ≈ 289)
    const timerProgress = currentQuestion ? (timeLeft / (currentQuestion.time_limit || 30)) * 100 : 100;

    const renderQuestion = () => {
        if (!currentQuestion) return null;
        return (
            <div className="kh-state">
                {/* Top Bar - Question Progress & Timer */}
                <div className="kh-q-head">
                    <div className="kh-stats">
                        <div className="kh-stat-pill">
                            <div className="kh-stat-pill-label">{t('kahoot.game.question')}</div>
                            <div className="kh-stat-pill-value">
                                {currentQuestion.question_number}<span style={{ opacity: 0.4 }}> / {currentQuestion.total_questions}</span>
                            </div>
                        </div>
                        <div className="kh-stat-pill">
                            <div className="kh-stat-pill-label">{t('kahoot.game.answers')}</div>
                            <div className="kh-stat-pill-value">{answersCount}</div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="kh-timer">
                        <div className="kh-timer-face">
                            <span className={`kh-timer-num ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>{timeLeft}</span>
                        </div>
                        <svg className="kh-timer-ring" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                            <circle
                                cx="50" cy="50" r="46" fill="none"
                                stroke={timeLeft <= 5 ? '#FF515F' : timeLeft <= 10 ? '#FF9E1B' : '#14B083'}
                                strokeWidth="4" strokeLinecap="round"
                                strokeDasharray={`${timerProgress * 2.89} 289`}
                            />
                        </svg>
                    </div>
                </div>

                {/* Question Card */}
                <div className="kh-q-card">
                    {currentQuestion.image && (
                        <img
                            src={getImageUrl(currentQuestion.image) || ''}
                            alt="Question"
                            className="kh-q-image"
                        />
                    )}
                    <h2 className="kh-q-text">{currentQuestion.text}</h2>
                </div>

                {/* Answer Options Grid */}
                <div className="kh-answers">
                    {currentQuestion.options.map((opt, idx) => {
                        const color = ANSWER_COLORS[idx % 4];
                        return (
                            <div key={opt.id} className={`kh-answer ${color.cls}`}>
                                <div className="kh-answer-icon">{color.icon}</div>
                                <span className="kh-answer-text">{opt.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderResults = () => {
        if (!questionStats) return <div className="kh-center-msg">{t('kahoot.game.loadingStats')}</div>;
        const maxCount = Math.max(...questionStats.option_stats.map(o => o.count), 1);

        return (
            <div className="kh-state">
                {/* Header */}
                <div className="kh-results-head">
                    <h2 className="kh-results-title">{t('kahoot.game.results')}</h2>
                    <p className="kh-results-sub">{t('kahoot.game.answersReceived', { count: questionStats.total_answers })}</p>
                </div>

                {/* Results Chart */}
                <div className="kh-bars">
                    {questionStats.option_stats.map((opt, idx) => {
                        const color = ANSWER_COLORS[idx % 4];
                        const heightPercent = (opt.count / maxCount) * 100;
                        const isCorrect = opt.is_correct;
                        const barColor = ['var(--shape-red)', 'var(--shape-blue)', 'var(--shape-gold)', 'var(--shape-green)'][idx % 4];

                        return (
                            <div key={opt.option_id} className="kh-bar-col">
                                {isCorrect && (
                                    <div className="kh-bar-check">
                                        <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}

                                <div className="kh-bar-count">{opt.count}</div>

                                <div
                                    className="kh-bar"
                                    style={{ height: `${Math.max(heightPercent, 10)}%`, background: barColor }}
                                />

                                <div className={`kh-bar-icon ${color.cls} ${!isCorrect ? 'is-dim' : ''}`}>{color.icon}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderLeaderboard = () => (
        <div className="kh-state">
            <div className="kh-results-head">
                <h2 className="kh-results-title">
                    <Trophy size={44} strokeWidth={1.75} color="#FFC23C" style={{ display: 'inline', verticalAlign: 'middle' }} /> {t('kahoot.game.leaderboard')}
                </h2>
            </div>

            <div className="kh-lb">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                        key={entry.user_id}
                        className={`kh-lb-row ${idx < 3 ? `kh-lb-row--${idx + 1}` : ''}`}
                    >
                        <div className="kh-lb-rank">{idx + 1}</div>
                        <div className="kh-lb-name">{entry.username}</div>
                        <div className="kh-lb-score">{entry.score}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFinished = () => (
        <div className="kh-state kh-finish">
            <PartyPopper size={80} strokeWidth={1.5} color="#FFC23C" />
            <h1 className="kh-finish-title">{t('kahoot.game.gameComplete')}</h1>

            {/* Podium */}
            <div className="kh-podium">
                {/* 2nd Place */}
                {leaderboard[1] && (
                    <div className="kh-podium-col">
                        <div className="kh-podium-name">{leaderboard[1].username}</div>
                        <div className="kh-podium-block kh-podium-block--2">
                            <span className="kh-podium-num">2</span>
                        </div>
                        <div className="kh-podium-pts">{t('kahoot.game.pts', { count: leaderboard[1].score })}</div>
                    </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                    <div className="kh-podium-col">
                        <Crown size={30} strokeWidth={1.75} color="#FFC23C" />
                        <div className="kh-podium-name kh-podium-name--gold">{leaderboard[0].username}</div>
                        <div className="kh-podium-block kh-podium-block--1">
                            <span className="kh-podium-num">1</span>
                        </div>
                        <div className="kh-podium-pts">{t('kahoot.game.pts', { count: leaderboard[0].score })}</div>
                    </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                    <div className="kh-podium-col">
                        <div className="kh-podium-name">{leaderboard[2].username}</div>
                        <div className="kh-podium-block kh-podium-block--3">
                            <span className="kh-podium-num">3</span>
                        </div>
                        <div className="kh-podium-pts">{t('kahoot.game.pts', { count: leaderboard[2].score })}</div>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/teacher/dashboard')}
                className="kh-btn kh-btn-return"
            >
                {t('kahoot.game.returnDashboard')}
            </button>
        </div>
    );

    const renderLoading = () => (
        <div className="kh-state kh-loading">
            <div className="spinner spinner-lg" />
            <div className="kh-loading-text">{t('kahoot.game.connecting')}</div>
            <div className="kh-loading-sub">{t('kahoot.game.room', { code: roomCode })}</div>
        </div>
    );

    return (
        <div className="kh-stage">
            {/* Animated Background Orbs */}
            <div className="kh-orb kh-orb--1" />
            <div className="kh-orb kh-orb--2" />

            {/* Room Code Badge */}
            <div className="kh-room-badge">
                <span className="kh-eyebrow">{t('kahoot.game.roomLabel')}</span>
                <div className="kh-room-code">{roomCode}</div>
            </div>

            {/* Control Bar */}
            {gameState !== 'finished' && gameState !== 'loading' && (
                <div className="kh-controls">
                    <button onClick={handleNext} className="kh-btn kh-btn-next">
                        <span>{t('kahoot.game.next')}</span>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button onClick={handleEndGame} className="kh-btn kh-btn-end">
                        {t('kahoot.game.endGame')}
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="kh-content">
                {gameState === 'question' && renderQuestion()}
                {gameState === 'results' && renderResults()}
                {gameState === 'leaderboard' && renderLeaderboard()}
                {gameState === 'finished' && renderFinished()}
                {gameState === 'loading' && renderLoading()}
            </div>
        </div>
    );
};

export default KahootHostGamePage;
