import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services';

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

const BACKEND_URL = 'http://localhost:8000';

const getImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
};

// Beautiful answer block colors matching Kahoot
const ANSWER_COLORS = [
    { bg: 'from-red-500 to-red-600', shadow: 'shadow-red-500/30', icon: '▲' },
    { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', icon: '◆' },
    { bg: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30', icon: '●' },
    { bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30', icon: '■' }
];

const KahootHostGamePage: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();

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
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = 'localhost:8000';
            const wsUrl = `${protocol}//${host}/ws/kahoot/${roomCode}/`;
            wsConnection = new WebSocket(wsUrl);

            wsConnection.onopen = async () => {
                if (!mounted) { wsConnection?.close(); return; }
                console.log('Connected to Game WS');
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
        console.log('Game WS Msg:', data.type, data);
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
        console.log('Sending:', type, payload);
        ws.current.send(JSON.stringify({ type, ...payload }));
    };

    const handleTimeUp = () => sendWsMessage('show_question_results');

    const handleNext = () => {
        if (gameState === 'question') sendWsMessage('show_question_results');
        else if (gameState === 'results') sendWsMessage('show_leaderboard');
        else if (gameState === 'leaderboard') sendWsMessage('next_question');
    };

    const handleEndGame = () => {
        if (confirm('Are you sure you want to end the game?')) sendWsMessage('end_quiz');
    };

    // Timer progress for animation
    const timerProgress = currentQuestion ? (timeLeft / (currentQuestion.time_limit || 30)) * 100 : 100;
    const timerColor = timerProgress > 50 ? 'bg-emerald-500' : timerProgress > 25 ? 'bg-amber-500' : 'bg-red-500';

    const renderQuestion = () => {
        if (!currentQuestion) return null;
        return (
            <div className="flex-1 flex flex-col p-4 md:p-8">
                {/* Top Bar - Question Progress & Timer */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3">
                            <span className="text-white/60 text-sm">Question</span>
                            <div className="text-white text-2xl font-black">
                                {currentQuestion.question_number} <span className="text-white/40">/ {currentQuestion.total_questions}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3">
                            <span className="text-white/60 text-sm">Answers</span>
                            <div className="text-white text-2xl font-black">{answersCount}</div>
                        </div>
                    </div>

                    {/* Beautiful Timer */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple-600/50 to-indigo-600/50 backdrop-blur-sm flex items-center justify-center shadow-2xl border-4 border-white/20">
                            <div className={`absolute inset-1 rounded-full ${timerColor} opacity-20`}></div>
                            <span className={`text-4xl md:text-5xl font-black text-white ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>
                                {timeLeft}
                            </span>
                        </div>
                        {/* Timer Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                            <circle
                                cx="50" cy="50" r="46" fill="none"
                                stroke={timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#10b981'}
                                strokeWidth="4" strokeLinecap="round"
                                strokeDasharray={`${timerProgress * 2.89} 289`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl mb-8 transform hover:scale-[1.01] transition-transform">
                    {currentQuestion.image && (
                        <div className="mb-6 flex justify-center">
                            <img
                                src={getImageUrl(currentQuestion.image) || ''}
                                alt="Question"
                                className="max-h-48 md:max-h-64 rounded-2xl shadow-lg object-contain"
                            />
                        </div>
                    )}
                    <h2 className="text-2xl md:text-4xl font-black text-gray-800 text-center leading-tight">
                        {currentQuestion.text}
                    </h2>
                </div>

                {/* Answer Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {currentQuestion.options.map((opt, idx) => {
                        const color = ANSWER_COLORS[idx % 4];
                        return (
                            <div
                                key={opt.id}
                                className={`bg-gradient-to-br ${color.bg} rounded-2xl p-6 flex items-center gap-4 shadow-xl ${color.shadow} transform hover:scale-[1.02] transition-all cursor-default`}
                            >
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-2xl md:text-3xl">{color.icon}</span>
                                </div>
                                <span className="text-white text-xl md:text-2xl font-bold flex-1">{opt.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderResults = () => {
        if (!questionStats) return <div className="flex-1 flex items-center justify-center text-white text-2xl">Loading stats...</div>;
        const maxCount = Math.max(...questionStats.option_stats.map(o => o.count), 1);

        return (
            <div className="flex-1 flex flex-col p-4 md:p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-2">Results</h2>
                    <p className="text-white/60 text-xl">{questionStats.total_answers} answers received</p>
                </div>

                {/* Results Chart */}
                <div className="flex-1 flex items-end justify-center gap-4 md:gap-8 pb-8">
                    {questionStats.option_stats.map((opt, idx) => {
                        const color = ANSWER_COLORS[idx % 4];
                        const heightPercent = (opt.count / maxCount) * 100;
                        const isCorrect = opt.is_correct;

                        return (
                            <div key={opt.option_id} className="flex flex-col items-center w-20 md:w-32">
                                {/* Correct Indicator */}
                                {isCorrect && (
                                    <div className="mb-4 animate-bounce">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {/* Count Badge */}
                                <div className="mb-2 text-white font-black text-2xl md:text-3xl">{opt.count}</div>

                                {/* Bar */}
                                <div
                                    className={`w-full bg-gradient-to-t ${color.bg} rounded-t-2xl shadow-lg ${color.shadow} transition-all duration-1000 ease-out`}
                                    style={{ height: `${Math.max(heightPercent, 10)}%`, minHeight: '60px' }}
                                />

                                {/* Icon */}
                                <div className={`mt-4 w-12 h-12 bg-gradient-to-br ${color.bg} rounded-xl flex items-center justify-center ${!isCorrect ? 'opacity-40' : ''}`}>
                                    <span className="text-white text-xl">{color.icon}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderLeaderboard = () => (
        <div className="flex-1 flex flex-col p-4 md:p-8">
            <div className="text-center mb-8">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-2">🏆 Leaderboard</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-3 max-w-2xl mx-auto w-full">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                        key={entry.user_id}
                        className={`w-full rounded-2xl p-4 md:p-6 flex items-center gap-4 transform hover:scale-[1.02] transition-all ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-xl shadow-amber-500/30' :
                                idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300 shadow-lg' :
                                    idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-600 shadow-lg' :
                                        'bg-white/10 backdrop-blur-sm'
                            }`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${idx === 0 ? 'bg-white/30 text-amber-900' :
                                idx === 1 ? 'bg-white/30 text-gray-700' :
                                    idx === 2 ? 'bg-white/30 text-amber-900' :
                                        'bg-white/10 text-white'
                            }`}>
                            {idx + 1}
                        </div>
                        <div className="flex-1">
                            <div className={`font-bold text-xl md:text-2xl ${idx < 3 ? 'text-gray-900' : 'text-white'}`}>
                                {entry.username}
                            </div>
                        </div>
                        <div className={`font-black text-2xl md:text-3xl ${idx < 3 ? 'text-gray-900' : 'text-white'}`}>
                            {entry.score}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFinished = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="text-6xl md:text-8xl mb-8">🎉</div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-12 text-center">Game Complete!</h1>

            {/* Podium */}
            <div className="flex items-end gap-4 mb-12">
                {/* 2nd Place */}
                {leaderboard[1] && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-white font-bold mb-2">{leaderboard[1].username}</div>
                        <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-xl flex items-center justify-center shadow-xl">
                            <span className="text-4xl md:text-5xl font-black text-gray-700">2</span>
                        </div>
                        <div className="text-white font-bold mt-2">{leaderboard[1].score} pts</div>
                    </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-3xl mb-2">👑</div>
                        <div className="text-yellow-300 font-black text-xl mb-2">{leaderboard[0].username}</div>
                        <div className="w-28 md:w-40 h-36 md:h-48 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-xl flex items-center justify-center shadow-2xl shadow-amber-500/50">
                            <span className="text-5xl md:text-6xl font-black text-amber-900">1</span>
                        </div>
                        <div className="text-white font-bold text-xl mt-2">{leaderboard[0].score} pts</div>
                    </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-white font-bold mb-2">{leaderboard[2].username}</div>
                        <div className="w-24 md:w-32 h-20 md:h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-xl flex items-center justify-center shadow-xl">
                            <span className="text-4xl md:text-5xl font-black text-amber-900">3</span>
                        </div>
                        <div className="text-white font-bold mt-2">{leaderboard[2].score} pts</div>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/teacher/dashboard')}
                className="bg-white text-indigo-900 px-10 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
                Return to Dashboard
            </button>
        </div>
    );

    const renderLoading = () => (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-t-white rounded-full animate-spin"></div>
            </div>
            <div className="text-white text-2xl font-bold">Connecting to game...</div>
            <div className="text-white/60 mt-2">Room: {roomCode}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex flex-col overflow-hidden relative">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Control Bar */}
            <div className="absolute top-4 right-4 z-50 flex gap-3">
                {gameState !== 'finished' && gameState !== 'loading' && (
                    <>
                        <button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>Next</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleEndGame}
                            className="bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
                        >
                            End Game
                        </button>
                    </>
                )}
            </div>

            {/* Room Code Badge */}
            <div className="absolute top-4 left-4 z-50">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                    <span className="text-white/60 text-sm">Room</span>
                    <div className="text-white font-black text-xl tracking-widest">{roomCode}</div>
                </div>
            </div>

            {/* Main Content */}
            {gameState === 'question' && renderQuestion()}
            {gameState === 'results' && renderResults()}
            {gameState === 'leaderboard' && renderLeaderboard()}
            {gameState === 'finished' && renderFinished()}
            {gameState === 'loading' && renderLoading()}
        </div>
    );
};

export default KahootHostGamePage;
