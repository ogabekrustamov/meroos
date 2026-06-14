import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2, Target, FileText, Sparkles, Check, ClipboardList, Tag,
    Users, DoorOpen, CheckCircle, XCircle, Rocket,
} from 'lucide-react';
import { quizService } from '../../services';
import type { Quiz } from '../../types';

const QUIZ_COLORS = [
    { bg: 'linear-gradient(135deg, #2F55F0, #1B3AC4)', glow: 'rgba(47, 85, 240, 0.35)' },
    { bg: 'linear-gradient(135deg, #FF515F, #E23847)', glow: 'rgba(255, 81, 95, 0.35)' },
    { bg: 'linear-gradient(135deg, #14B083, #0E8E69)', glow: 'rgba(20, 176, 131, 0.35)' },
    { bg: 'linear-gradient(135deg, #FF9E1B, #F37A0C)', glow: 'rgba(255, 158, 27, 0.35)' },
    { bg: 'linear-gradient(135deg, #2F7DFF, #2F55F0)', glow: 'rgba(47, 125, 255, 0.35)' },
    { bg: 'linear-gradient(135deg, #1FC08A, #14B083)', glow: 'rgba(31, 192, 138, 0.35)' },
];

const KahootHostSetupPage: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
    const [maxPlayers, setMaxPlayers] = useState(50);
    const [allowLateJoin, setAllowLateJoin] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

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

    const handleCreateRoom = async () => {
        if (!selectedQuizId) return;

        setCreating(true);
        try {
            const room = await quizService.createKahootRoom(selectedQuizId, maxPlayers, allowLateJoin);
            navigate(`/teacher/kahoot/lobby/${room.room_code}`);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingContent}>
                    <div style={styles.loadingIcon}><Gamepad2 size={48} strokeWidth={1.75} /></div>
                    <div className="spinner" />
                    <p style={styles.loadingText}>Loading your quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Decorative background shapes */}
            <div style={styles.bgShape1} />
            <div style={styles.bgShape2} />
            <div style={styles.bgShape3} />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <button
                        onClick={() => navigate(-1)}
                        style={styles.backButton}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                        }}
                    >
                        ← Back
                    </button>
                    <div style={styles.headerContent}>
                        <span style={styles.headerEmoji}><Target size={48} strokeWidth={1.75} color="#FFFFFF" /></span>
                        <h1 style={styles.title}>Host a Kahoot Game</h1>
                        <p style={styles.subtitle}>
                            Pick a quiz, tweak the settings, and launch your game room!
                        </p>
                    </div>
                </div>

                {/* Step 1: Quiz Selection */}
                <div style={styles.section}>
                    <div style={styles.stepBadge}>
                        <span style={styles.stepNumber}>1</span>
                        <span style={styles.stepLabel}>Choose Your Quiz</span>
                    </div>

                    {quizzes.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}><FileText size={52} strokeWidth={1.75} /></div>
                            <h3 style={styles.emptyTitle}>No Kahoot quizzes yet!</h3>
                            <p style={styles.emptyText}>
                                Create your first Kahoot-style quiz to get started.
                            </p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate('/teacher/quizzes/create')}
                                style={{ marginTop: '1rem' }}
                            >
                                <Sparkles size={18} strokeWidth={1.85} /> Create a Quiz
                            </button>
                        </div>
                    ) : (
                        <div style={styles.quizGrid}>
                            {quizzes.map((quiz, index) => {
                                const color = QUIZ_COLORS[index % QUIZ_COLORS.length];
                                const isSelected = selectedQuizId === quiz.id;
                                return (
                                    <div
                                        key={quiz.id}
                                        onClick={() => setSelectedQuizId(quiz.id)}
                                        style={{
                                            ...styles.quizCard,
                                            ...(isSelected ? {
                                                border: '3px solid #2F55F0',
                                                boxShadow: `0 0 0 3px rgba(47,85,240,0.2), 0 8px 30px ${color.glow}`,
                                                transform: 'scale(1.03)',
                                            } : {}),
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                                                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 30px ${color.glow}`;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                                            }
                                        }}
                                    >
                                        {/* Color strip */}
                                        <div style={{ ...styles.quizColorStrip, background: color.bg }} />

                                        {/* Selected checkmark */}
                                        {isSelected && (
                                            <div style={styles.selectedBadge}><Check size={16} strokeWidth={2.5} /></div>
                                        )}

                                        <div style={styles.quizCardBody}>
                                            <h4 style={styles.quizTitle}>{quiz.title}</h4>
                                            <p style={styles.quizDesc}>
                                                {quiz.description || 'No description'}
                                            </p>
                                            <div style={styles.quizMeta}>
                                                <span style={{
                                                    ...styles.quizMetaBadge,
                                                    background: color.bg,
                                                }}>
                                                    <ClipboardList size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {quiz.total_questions} Q's
                                                </span>
                                                {quiz.category?.name && (
                                                    <span style={styles.quizCategoryBadge}>
                                                        <Tag size={14} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {quiz.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Step 2: Game Settings */}
                {selectedQuizId && (
                    <div style={{ ...styles.section, animation: 'fadeSlideUp 0.4s ease' }}>
                        <div style={styles.stepBadge}>
                            <span style={{ ...styles.stepNumber, background: 'var(--gradient-accent)' }}>2</span>
                            <span style={styles.stepLabel}>Game Settings</span>
                        </div>

                        <div style={styles.settingsGrid}>
                            {/* Max Players */}
                            <div style={styles.settingCard}>
                                <div style={styles.settingIcon}><Users size={32} strokeWidth={1.75} /></div>
                                <div style={styles.settingContent}>
                                    <label htmlFor="max-players" style={styles.settingLabel}>
                                        Max Players
                                    </label>
                                    <p style={styles.settingHint}>How many students can join?</p>
                                    <input
                                        type="number"
                                        id="max-players"
                                        name="max-players"
                                        min="2"
                                        max="100"
                                        value={maxPlayers}
                                        onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                        className="input"
                                        style={styles.settingInput}
                                    />
                                </div>
                            </div>

                            {/* Allow Late Join */}
                            <div style={styles.settingCard}>
                                <div style={styles.settingIcon}><DoorOpen size={32} strokeWidth={1.75} /></div>
                                <div style={styles.settingContent}>
                                    <label style={styles.settingLabel}>Allow Late Join</label>
                                    <p style={styles.settingHint}>
                                        Let players join after the game starts
                                    </p>
                                    <div
                                        onClick={() => setAllowLateJoin(!allowLateJoin)}
                                        style={{
                                            ...styles.toggle,
                                            background: allowLateJoin
                                                ? 'linear-gradient(135deg, #14B083, #0E8E69)'
                                                : 'var(--color-gray-300)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...styles.toggleKnob,
                                                transform: allowLateJoin ? 'translateX(24px)' : 'translateX(2px)',
                                            }}
                                        />
                                    </div>
                                    <span style={styles.toggleLabel}>
                                        {allowLateJoin
                                            ? <><CheckCircle size={14} strokeWidth={1.85} color="var(--jade)" style={{ verticalAlign: 'text-bottom' }} /> Enabled</>
                                            : <><XCircle size={14} strokeWidth={1.85} color="var(--shape-red)" style={{ verticalAlign: 'text-bottom' }} /> Disabled</>}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Launch Button */}
                        <div style={styles.launchSection}>
                            <button
                                type="button"
                                onClick={handleCreateRoom}
                                disabled={creating}
                                style={{
                                    ...styles.launchButton,
                                    ...(creating ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                                }}
                                onMouseEnter={e => {
                                    if (!creating) {
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.02)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 20px 40px rgba(47, 85, 240, 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!creating) {
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px rgba(47, 85, 240, 0.3)';
                                    }
                                }}
                            >
                                {creating ? (
                                    <>
                                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                        Creating Room...
                                    </>
                                ) : (
                                    <>
                                        <Rocket size={20} strokeWidth={1.85} /> Launch Game Room
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes floatReverse {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-5deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F1013 0%, #1A1C22 40%, #24262F 70%, #1A1C22 100%)',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
    },
    bgShape1: {
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(47, 85, 240, 0.15), transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none',
    },
    bgShape2: {
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244, 63, 94, 0.12), transparent 70%)',
        animation: 'floatReverse 10s ease-in-out infinite',
        pointerEvents: 'none',
    },
    bgShape3: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08), transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
        pointerEvents: 'none',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
    },

    // Header
    header: {
        marginBottom: '2.5rem',
        textAlign: 'center' as const,
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.25rem',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '9999px',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '1.5rem',
    },
    headerContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
    },
    headerEmoji: {
        fontSize: '3rem',
        animation: 'pulse 3s ease-in-out infinite',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #C2CCFB, #EAEDFE, #F4F1EA)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: 'rgba(255,255,255,0.6)',
        maxWidth: '500px',
    },

    // Section
    section: {
        marginBottom: '2rem',
    },
    stepBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.25rem',
    },
    stepNumber: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'var(--gradient-primary)',
        color: 'white',
        fontWeight: 700,
        fontSize: '0.875rem',
        boxShadow: '0 4px 12px rgba(47, 85, 240, 0.4)',
    },
    stepLabel: {
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.9)',
    },

    // Quiz Grid
    quizGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem',
    },
    quizCard: {
        position: 'relative' as const,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
    },
    quizColorStrip: {
        height: '5px',
        width: '100%',
    },
    selectedBadge: {
        position: 'absolute' as const,
        top: '12px',
        right: '12px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #14B083, #0E8E69)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
    },
    quizCardBody: {
        padding: '1.25rem',
    },
    quizTitle: {
        fontSize: '1.05rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.95)',
        marginBottom: '0.4rem',
    },
    quizDesc: {
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '0.75rem',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
    },
    quizMeta: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '0.5rem',
    },
    quizMetaBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 600,
    },
    quizCategoryBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.75rem',
        fontWeight: 500,
    },

    // Empty State
    emptyState: {
        textAlign: 'center' as const,
        padding: '3rem 2rem',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '2px dashed rgba(255,255,255,0.15)',
        borderRadius: '1.5rem',
    },
    emptyIcon: {
        fontSize: '3.5rem',
        marginBottom: '1rem',
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '1.3rem',
        marginBottom: '0.5rem',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.95rem',
    },

    // Settings
    settingsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },
    settingCard: {
        display: 'flex',
        gap: '1rem',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
    },
    settingIcon: {
        fontSize: '2rem',
        flexShrink: 0,
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.9)',
        display: 'block',
        marginBottom: '0.15rem',
    },
    settingHint: {
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: '0.75rem',
    },
    settingInput: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'white',
        borderRadius: '0.75rem',
        padding: '0.65rem 1rem',
        fontSize: '1rem',
        maxWidth: '140px',
    },
    toggle: {
        width: '52px',
        height: '28px',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative' as const,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    toggleKnob: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute' as const,
        top: '2px',
        transition: 'transform 0.3s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    },
    toggleLabel: {
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)',
        marginTop: '0.5rem',
        display: 'block',
    },

    // Launch Button
    launchSection: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '2rem',
    },
    launchButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 2.5rem',
        fontSize: '1.15rem',
        fontWeight: 700,
        color: 'white',
        background: 'linear-gradient(135deg, #2F55F0, #1B3AC4, #173098)',
        border: 'none',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px rgba(47, 85, 240, 0.3)',
        fontFamily: 'inherit',
        letterSpacing: '0.01em',
    },

    // Loading
    loadingScreen: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F1013 0%, #1A1C22 40%, #24262F 100%)',
    },
    loadingContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '1.25rem',
    },
    loadingIcon: {
        fontSize: '3rem',
        animation: 'pulse 2s ease-in-out infinite',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '1rem',
    },
};

export default KahootHostSetupPage;
