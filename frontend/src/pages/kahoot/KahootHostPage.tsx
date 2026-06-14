import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { quizService } from '../../services';
import type { Quiz, KahootRoom, KahootPlayer } from '../../types';

interface WebSocketMessage {
    type: string;
    [key: string]: unknown;
}

const KahootHostPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
    const [room, setRoom] = useState<KahootRoom | null>(null);
    const [players, setPlayers] = useState<KahootPlayer[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const data = await quizService.getQuizzes({ quiz_type: 'kahoot' });
                setQuizzes(data.results);
            } catch (error) {
                console.error('Failed to fetch quizzes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    const connectWebSocket = useCallback((roomCode: string) => {
        const ws = new WebSocket(`ws://localhost:8000/ws/kahoot/${roomCode}/`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            ws.send(JSON.stringify({
                type: 'join',
                user_id: user?.id,
                username: user?.username,
                is_host: true,
            }));
        };

        ws.onmessage = (event) => {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log('WS message:', data);

            switch (data.type) {
                case 'player_joined':
                    setPlayers((prev) => {
                        const exists = prev.find((p) => p.id === (data.user_id as number));
                        if (exists) return prev;
                        return [...prev, {
                            id: data.user_id as number,
                            username: data.username as string,
                            score: 0,
                            rank: prev.length + 1,
                        }];
                    });
                    break;
                case 'player_left':
                    setPlayers((prev) => prev.filter((p) => p.id !== (data.user_id as number)));
                    break;
                case 'leaderboard_update':
                    setPlayers(data.leaderboard as KahootPlayer[]);
                    break;
                case 'quiz_ended':
                    setGameStarted(false);
                    break;
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        wsRef.current = ws;
    }, [user]);

    const handleCreateRoom = async () => {
        if (!selectedQuiz) return;

        setCreating(true);
        try {
            const roomData = await quizService.createKahootRoom(selectedQuiz);
            setRoom(roomData);
            connectWebSocket(roomData.room_code);
        } catch (error) {
            console.error('Failed to create room:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleStartGame = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'start_quiz',
                user_id: user?.id,
            }));
            setGameStarted(true);
            setCurrentQuestion(1);
        }
    };

    const handleNextQuestion = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'next_question',
                user_id: user?.id,
            }));
            setCurrentQuestion((prev) => prev + 1);
        }
    };

    const handleEndGame = async () => {
        if (room) {
            try {
                await quizService.endKahootRoom(room.room_code);
            } catch (error) {
                console.error('Failed to end room:', error);
            }
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        navigate('/teacher');
    };

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Room created - show waiting room or game
    if (room) {
        return (
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                {/* Room Code Display */}
                <div
                    style={{
                        background: 'var(--gradient-accent)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: 'var(--space-8)',
                        marginBottom: 'var(--space-8)',
                        color: 'white',
                    }}
                >
                    <p style={{ opacity: 0.9, marginBottom: 'var(--space-2)' }}>Join at meroos.com/kahoot</p>
                    <h1 style={{ fontSize: '4rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                        {room.room_code}
                    </h1>
                    <p style={{ marginTop: 'var(--space-4)' }}>
                        {room.quiz.title}
                    </p>
                </div>

                {/* Player Count */}
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card-body">
                        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                            {gameStarted ? `Question ${currentQuestion}` : `${players.length} Players Joined`}
                        </h2>

                        {!gameStarted ? (
                            <div className="flex flex-wrap gap-3 justify-center">
                                {players.map((player) => (
                                    <div
                                        key={player.id}
                                        className="badge badge-primary"
                                        style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-base)' }}
                                    >
                                        {player.username}
                                    </div>
                                ))}
                                {players.length === 0 && (
                                    <p className="text-muted animate-pulse">Waiting for players...</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                {/* Leaderboard */}
                                <table style={{ width: '100%', textAlign: 'left' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: 'var(--space-3)' }}>Rank</th>
                                            <th style={{ padding: 'var(--space-3)' }}>Player</th>
                                            <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players
                                            .sort((a, b) => b.score - a.score)
                                            .map((player, idx) => (
                                                <tr key={player.id}>
                                                    <td style={{ padding: 'var(--space-3)' }}>
                                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                                    </td>
                                                    <td style={{ padding: 'var(--space-3)' }}>{player.username}</td>
                                                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'bold' }}>
                                                        {player.score}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4 justify-center">
                    {!gameStarted ? (
                        <button
                            onClick={handleStartGame}
                            disabled={players.length === 0}
                            className="btn btn-primary btn-lg"
                        >
                            🚀 Start Game
                        </button>
                    ) : (
                        <button onClick={handleNextQuestion} className="btn btn-primary btn-lg">
                            Next Question →
                        </button>
                    )}
                    <button onClick={handleEndGame} className="btn btn-secondary btn-lg">
                        End Game
                    </button>
                </div>
            </div>
        );
    }

    // Quiz selection
    return (
        <div>
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 className="page-title">Host Kahoot</h1>
                <p className="text-secondary">Select a quiz to start a live game session</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {quizzes.map((quiz) => (
                    <div
                        key={quiz.id}
                        className="card"
                        onClick={() => setSelectedQuiz(quiz.id)}
                        style={{
                            cursor: 'pointer',
                            border: selectedQuiz === quiz.id ? '2px solid var(--color-primary-500)' : undefined,
                        }}
                    >
                        <div className="card-body">
                            <span className="badge badge-primary" style={{ marginBottom: 'var(--space-3)' }}>
                                {quiz.category?.name}
                            </span>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
                                {quiz.title}
                            </h3>
                            <p className="text-secondary text-sm">
                                {quiz.total_questions} questions
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {quizzes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">🎮</div>
                    <h3 className="empty-state-title">No Kahoot quizzes available</h3>
                    <p className="empty-state-description">Create a quiz with Kahoot type first</p>
                </div>
            )}

            {selectedQuiz && (
                <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                    <button
                        onClick={handleCreateRoom}
                        disabled={creating}
                        className="btn btn-primary btn-lg"
                    >
                        {creating ? 'Creating Room...' : '🎮 Create Game Room'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default KahootHostPage;
