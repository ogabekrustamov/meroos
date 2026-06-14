import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts';
import { quizService } from '../../services';
import type { KahootRoom, QuizQuestion } from '../../types';

interface WebSocketMessage {
    type: string;
    question?: QuizQuestion;
    leaderboard?: Array<{ id: number; username: string; score: number; rank: number }>;
    results?: {
        winner: { username: string; score: number };
        rankings: Array<{ rank: number; username: string; score: number }>;
    };
    total_players?: number;
    [key: string]: unknown;
}

const KahootJoinPage: React.FC = () => {
    const { user } = useAuth();
    const [roomCode, setRoomCode] = useState('');
    const [room, setRoom] = useState<KahootRoom | null>(null);
    const [joined, setJoined] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState<number | null>(null);
    const [gameEnded, setGameEnded] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const startTimeRef = useRef<number>(0);

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) return;

        setLoading(true);
        setError('');

        try {
            const roomData = await quizService.getKahootRoom(roomCode.toUpperCase());
            setRoom(roomData);

            // Connect WebSocket
            const ws = new WebSocket(`ws://localhost:8000/ws/kahoot/${roomCode.toUpperCase()}/`);

            ws.onopen = () => {
                console.log('Connected to Kahoot room');
                ws.send(JSON.stringify({
                    type: 'join',
                    user_id: user?.id || Math.random().toString(36).slice(2, 9),
                    username: user?.username || `Guest_${Math.random().toString(36).slice(2, 6)}`,
                }));
                setJoined(true);
            };

            ws.onmessage = (event) => {
                const data: WebSocketMessage = JSON.parse(event.data);
                console.log('WS message:', data);

                switch (data.type) {
                    case 'quiz_started':
                    case 'next_question':
                        setGameStarted(true);
                        setCurrentQuestion(data.question || null);
                        setSelectedAnswer(null);
                        setAnswerSubmitted(false);
                        startTimeRef.current = Date.now();
                        break;

                    case 'leaderboard_update':
                        if (data.leaderboard) {
                            const myEntry = data.leaderboard.find(
                                (p) => p.username === (user?.username || '')
                            );
                            if (myEntry) {
                                setScore(myEntry.score);
                                setRank(myEntry.rank);
                            }
                        }
                        break;

                    case 'quiz_ended':
                        setGameEnded(true);
                        setGameStarted(false);
                        if (data.results) {
                            const myResult = data.results.rankings.find(
                                (r) => r.username === (user?.username || '')
                            );
                            if (myResult) {
                                setRank(myResult.rank);
                                setScore(myResult.score);
                            }
                        }
                        break;

                    case 'error':
                        setError(data.message as string);
                        break;
                }
            };

            ws.onclose = () => {
                console.log('Disconnected from Kahoot room');
            };

            wsRef.current = ws;
        } catch (err) {
            setError('Room not found or already ended');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (optionId: number) => {
        if (answerSubmitted || !wsRef.current) return;

        setSelectedAnswer(optionId);
        setAnswerSubmitted(true);

        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

        wsRef.current.send(JSON.stringify({
            type: 'submit_answer',
            user_id: user?.id || 'guest',
            answer_ids: [optionId],
            time_taken: timeTaken,
        }));
    };

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Game ended screen
    if (gameEnded) {
        return (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div
                    style={{
                        background: 'var(--gradient-accent)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: 'var(--space-10)',
                        color: 'white',
                    }}
                >
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
                        {rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎮'}
                    </div>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                        Game Over!
                    </h1>
                    <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-6)' }}>
                        You finished in place #{rank}
                    </p>
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--space-6)',
                        }}
                    >
                        <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'bold' }}>{score}</div>
                        <div style={{ opacity: 0.9 }}>points</div>
                    </div>
                </div>
            </div>
        );
    }

    // In-game screen
    if (gameStarted && currentQuestion) {
        const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
        const shapes = ['▲', '◆', '●', '■'];

        return (
            <div style={{ maxWidth: '100%' }}>
                {/* Score Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                    <div>
                        <span className="text-muted">Score</span>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>{score}</div>
                    </div>
                    {rank && (
                        <div className="badge badge-primary" style={{ fontSize: 'var(--font-size-lg)', padding: 'var(--space-3) var(--space-5)' }}>
                            #{rank}
                        </div>
                    )}
                </div>

                {!answerSubmitted ? (
                    <>
                        {/* Question */}
                        <div
                            className="card"
                            style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}
                        >
                            <div className="card-body">
                                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>
                                    {currentQuestion.question_text}
                                </h2>
                            </div>
                        </div>

                        {/* Answer Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectAnswer(option.id)}
                                    style={{
                                        background: colors[index % 4],
                                        color: 'white',
                                        padding: 'var(--space-8)',
                                        borderRadius: 'var(--radius-xl)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        transition: 'transform var(--transition-fast)',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    <span style={{ fontSize: '2rem' }}>{shapes[index % 4]}</span>
                                    <span>{option.option_text}</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    // Waiting for results
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div className="card-body" style={{ padding: 'var(--space-12)' }}>
                            <div className="spinner" style={{ margin: '0 auto var(--space-6)' }}></div>
                            <h2>Answer Submitted!</h2>
                            <p className="text-secondary">Waiting for other players...</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Waiting room
    if (joined && room) {
        return (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div
                    style={{
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: 'var(--space-10)',
                        color: 'white',
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎮</div>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                        You're In!
                    </h1>
                    <p style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                        {room.quiz.title}
                    </p>
                    <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'white' }}></div>
                    <p style={{ marginTop: 'var(--space-4)', opacity: 0.9 }}>
                        Waiting for the host to start...
                    </p>
                </div>
            </div>
        );
    }

    // Join screen
    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🎮</div>
                <h1 className="page-title">Join Kahoot</h1>
                <p className="text-secondary">Enter the game PIN shown on your teacher's screen</p>
            </div>

            {error && (
                <div className="toast toast-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                        <label htmlFor="roomCode" className="input-label">
                            Game PIN
                        </label>
                        <input
                            id="roomCode"
                            type="text"
                            className="input"
                            placeholder="Enter 6-digit code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{ fontSize: 'var(--font-size-2xl)', textAlign: 'center', letterSpacing: '0.2em' }}
                        />
                    </div>

                    <button
                        onClick={handleJoinRoom}
                        disabled={!roomCode.trim() || loading}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Joining...' : 'Join Game'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KahootJoinPage;
