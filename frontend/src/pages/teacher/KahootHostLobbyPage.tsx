import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizService, getAccessToken } from '../../services';
import { useToast } from '../../contexts';
import { wsUrl } from '../../config';
import type { KahootRoom } from '../../types';
import './kahoot-host.css';

const KahootHostLobbyPage: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();
    const [room, setRoom] = useState<KahootRoom | null>(null);
    const [players, setPlayers] = useState<any[]>([]); // We'll store player objects here
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        if (!roomCode) return;
        fetchRoomDetails();
        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [roomCode]);

    const fetchRoomDetails = async () => {
        try {
            if (!roomCode) return;
            const data = await quizService.getKahootRoom(roomCode);
            setRoom(data);
            if (data.status === 'in_progress') {
                navigate(`/teacher/kahoot/game/${roomCode}`);
                return;
            }
            if (data.status === 'completed') {
                toast.info(t('kahoot.lobby.alreadyFinished'));
                // Optionally navigate to leaderboard
                // navigate(`/teacher/kahoot/leaderboard/${roomCode}`);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch room:', error);
            // Handle error (redirect back to setup?)
            navigate('/teacher/kahoot/setup');
        }
    };

    const connectWebSocket = () => {
        if (!roomCode) return;

        // Pass the JWT in the query string — the backend JWTAuthMiddleware
        // resolves scope['user'] from ?token=<access>; without it the consumer
        // rejects the socket (close code 4401) since this app uses JWT, not cookies.
        const token = getAccessToken();
        const newWs = new WebSocket(
            wsUrl(`/ws/kahoot/${roomCode}/${token ? `?token=${encodeURIComponent(token)}` : ''}`)
        );

        newWs.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'player_joined') {
                setPlayers((prev) => {
                    // Avoid duplicates
                    if (prev.find(p => p.id === data.user_id)) return prev;
                    return [...prev, { id: data.user_id, username: data.username }];
                });
            } else if (data.type === 'quiz_started') {
                navigate(`/teacher/kahoot/game/${roomCode}`);
            }
        };

        setWs(newWs);
    };

    const handleStartGame = async () => {
        if (!roomCode || !ws || isStarting) return;

        setIsStarting(true);
        // Send start message via WS or API. 
        // Using API is more reliable for state persistence, WS for broadcasting.
        // Consumer handles 'start_quiz' message type OR API endpoint.
        // Let's use the API endpoint which likely triggers the broadcast.
        try {
            await quizService.startKahootRoom(roomCode);
            // The WS 'quiz_started' event will trigger navigation
        } catch (error) {
            console.error('Failed to start game:', error);
            toast.error(t('kahoot.lobby.startFailed'));
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="kh-stage">
                <div className="kh-orb kh-orb--1" />
                <div className="kh-orb kh-orb--2" />
                <div className="kh-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="kh-loading-text">{t('kahoot.lobby.loading')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="kh-stage">
            <div className="kh-orb kh-orb--1" />
            <div className="kh-orb kh-orb--2" />
            <div className="kh-content">
                {/* Header */}
                <div className="kh-lobby-header">
                    <h1 className="kh-lobby-title">{t('kahoot.lobby.liveTitle')}</h1>
                    <div className="kh-pin-wrap">
                        <span className="kh-eyebrow">{t('kahoot.lobby.gamePin')}</span>
                        <span className="kh-pin">{roomCode}</span>
                    </div>
                    <div className="kh-players">
                        <div className="kh-players-count">{players.length}</div>
                        <div className="kh-players-label">{t('kahoot.lobby.players')}</div>
                    </div>
                </div>

                {/* Main Content (Player Grid) */}
                <div className="kh-lobby-body">
                    {players.length === 0 ? (
                        <div className="kh-waiting">
                            <div className="kh-waiting-title">{t('kahoot.lobby.waitingPlayers')}</div>
                            <div className="animate-pulse">{t('kahoot.lobby.joinAt')}</div>
                        </div>
                    ) : (
                        <div className="kh-player-grid">
                            {players.map((player) => (
                                <div key={player.id} className="kh-player-chip">
                                    {player.username}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Controls */}
                <div className="kh-lobby-footer">
                    <div className="kh-quiz-name">
                        {t('kahoot.lobby.quiz', { title: room?.quiz.title })}
                    </div>
                    <button
                        onClick={handleStartGame}
                        disabled={players.length === 0 || isStarting}
                        className="kh-btn kh-btn-lg kh-btn-start"
                    >
                        {isStarting ? t('kahoot.lobby.starting') : t('kahoot.lobby.startGame')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KahootHostLobbyPage;
