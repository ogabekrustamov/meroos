import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizService, getAccessToken } from '../../services';
import { wsUrl } from '../../config';
import type { KahootRoom } from '../../types';

const KahootHostLobbyPage: React.FC = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
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
                alert(t('kahoot.lobby.alreadyFinished'));
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

        newWs.onopen = () => {
            console.log('Connected to Kahoot WebSocket');
        };

        newWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WS Message:', data);

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

        newWs.onclose = () => {
            console.log('Disconnected from Kahoot WebSocket');
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
            alert(t('kahoot.lobby.startFailed'));
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-indigo-900">
                <div className="text-white text-xl">{t('kahoot.lobby.loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-indigo-900 flex flex-col text-white">
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-indigo-800 shadow-md">
                <div>
                    <h1 className="text-2xl font-bold">{t('kahoot.lobby.liveTitle')}</h1>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-sm uppercase tracking-wider opacity-75">{t('kahoot.lobby.gamePin')}</span>
                    <span className="text-5xl font-black tracking-widest bg-white text-indigo-900 px-6 py-2 rounded-lg shadow-lg mt-1">
                        {roomCode}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-xl font-medium">{players.length}</div>
                    <div className="text-sm opacity-75">{t('kahoot.lobby.players')}</div>
                </div>
            </div>

            {/* Main Content (Player Grid) */}
            <div className="flex-1 p-8 overflow-y-auto">
                {players.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <div className="text-3xl font-light mb-4">{t('kahoot.lobby.waitingPlayers')}</div>
                        <div className="animate-pulse text-lg">{t('kahoot.lobby.joinAt')}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className="bg-indigo-700 bg-opacity-50 rounded-lg p-3 text-center transform transition-all hover:scale-105 animate-fade-in"
                            >
                                <div className="font-bold truncate">{player.username}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="p-6 bg-indigo-800 border-t border-indigo-700 flex justify-between items-center">
                <div className="text-sm opacity-75">
                    {t('kahoot.lobby.quiz', { title: room?.quiz.title })}
                </div>
                <button
                    onClick={handleStartGame}
                    disabled={players.length === 0 || isStarting}
                    className={`px-8 py-4 rounded-full text-xl font-bold shadow-lg transform transition-all ${players.length === 0 || isStarting
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-green-500 hover:bg-green-400 hover:scale-105 active:scale-95 text-white'
                        }`}
                >
                    {isStarting ? t('kahoot.lobby.starting') : t('kahoot.lobby.startGame')}
                </button>
            </div>
        </div>
    );
};

export default KahootHostLobbyPage;
