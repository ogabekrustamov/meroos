import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Gamepad2, FileText, Sparkles, Check, ClipboardList, Tag,
    Users, DoorOpen, Rocket,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { quizService } from '../../services';
import { useToast } from '../../contexts';
import type { Quiz } from '../../types';

// Brand "shape" colors give each quiz card a subtle pop of Kahoot energy
// while the surface itself stays on the light design system.
const QUIZ_ACCENTS = [
    'var(--shape-blue)',
    'var(--shape-red)',
    'var(--shape-green)',
    'var(--shape-gold)',
];

const KahootHostSetupPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();
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
            toast.error(t('kahoot.setup.createFailed'));
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div>
            {/* Back link */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: 'var(--space-4)' }}
            >
                <ArrowLeft size={16} strokeWidth={2} /> {t('kahoot.setup.back')}
            </button>

            {/* Hero */}
            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-8)',
                    marginBottom: 'var(--space-8)',
                    color: 'white',
                }}
            >
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: 'var(--radius-xl)',
                            background: 'rgba(255,255,255,0.18)',
                            marginBottom: 'var(--space-4)',
                        }}
                    >
                        <Gamepad2 size={30} strokeWidth={1.85} />
                    </div>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                        {t('kahoot.setup.hostTitle')}
                    </h1>
                    <p style={{ opacity: 0.9, maxWidth: '520px' }}>
                        {t('kahoot.setup.hostSubtitle')}
                    </p>
                </div>
                {/* Soft decorative glow */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-40%',
                        right: '-5%',
                        width: '320px',
                        height: '320px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* Step 1: Choose a quiz */}
            <section style={{ marginBottom: 'var(--space-8)' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                    <span className="kahoot-step">1</span>
                    <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{t('kahoot.setup.chooseQuiz')}</h2>
                </div>

                {quizzes.length === 0 ? (
                    <div className="card">
                        <div className="card-body flex flex-col items-center text-center" style={{ padding: 'var(--space-10)' }}>
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: 'var(--radius-xl)',
                                    background: 'var(--color-primary-50)',
                                    color: 'var(--color-primary-500)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 'var(--space-4)',
                                }}
                            >
                                <FileText size={30} strokeWidth={1.75} />
                            </div>
                            <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                                {t('kahoot.setup.noQuizzes')}
                            </h3>
                            <p className="text-secondary" style={{ marginBottom: 'var(--space-5)', maxWidth: '360px' }}>
                                {t('kahoot.setup.noQuizzesDesc')}
                            </p>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate('/quizzes/create')}
                            >
                                <Sparkles size={18} strokeWidth={1.85} /> {t('kahoot.setup.createQuiz')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {quizzes.map((quiz, index) => {
                            const accent = QUIZ_ACCENTS[index % QUIZ_ACCENTS.length];
                            const isSelected = selectedQuizId === quiz.id;
                            return (
                                <button
                                    key={quiz.id}
                                    type="button"
                                    onClick={() => setSelectedQuizId(quiz.id)}
                                    className="card kahoot-quiz-card"
                                    style={{
                                        textAlign: 'left',
                                        padding: 0,
                                        cursor: 'pointer',
                                        border: isSelected
                                            ? '2px solid var(--color-primary-500)'
                                            : '2px solid transparent',
                                        boxShadow: isSelected
                                            ? '0 0 0 4px var(--color-primary-50)'
                                            : 'var(--shadow-sm)',
                                    }}
                                >
                                    {/* accent strip */}
                                    <div style={{ height: '5px', background: accent, borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }} />
                                    <div className="card-body" style={{ position: 'relative' }}>
                                        {isSelected && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: 'var(--space-3)',
                                                    right: 'var(--space-3)',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'var(--color-primary-500)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </span>
                                        )}
                                        <h3 className="font-semibold" style={{ marginBottom: 'var(--space-1)', paddingRight: 'var(--space-6)' }}>
                                            {quiz.title}
                                        </h3>
                                        <p
                                            className="text-sm text-secondary"
                                            style={{
                                                marginBottom: 'var(--space-3)',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                minHeight: '2.5em',
                                            }}
                                        >
                                            {quiz.description || t('kahoot.setup.noDescription')}
                                        </p>
                                        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                                            <span className="badge badge-primary">
                                                <ClipboardList size={13} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {t('kahoot.setup.questionsShort', { count: quiz.total_questions })}
                                            </span>
                                            {quiz.category?.name && (
                                                <span className="badge">
                                                    <Tag size={13} strokeWidth={1.85} style={{ verticalAlign: 'text-bottom' }} /> {quiz.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Step 2: Game settings */}
            {selectedQuizId && (
                <section style={{ marginBottom: 'var(--space-8)', animation: 'fadeSlideUp 0.3s ease' }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                        <span className="kahoot-step">2</span>
                        <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{t('kahoot.setup.gameSettings')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Max players */}
                        <div className="card">
                            <div className="card-body flex gap-4" style={{ alignItems: 'flex-start' }}>
                                <div className="kahoot-setting-icon">
                                    <Users size={24} strokeWidth={1.85} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="max-players" className="font-semibold" style={{ display: 'block' }}>
                                        {t('kahoot.setup.maxPlayers')}
                                    </label>
                                    <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                                        {t('kahoot.setup.maxPlayersDesc')}
                                    </p>
                                    <input
                                        type="number"
                                        id="max-players"
                                        name="max-players"
                                        min={2}
                                        max={100}
                                        value={maxPlayers}
                                        onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 2)}
                                        className="input"
                                        style={{ maxWidth: '140px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Allow late join */}
                        <div className="card">
                            <div className="card-body flex gap-4" style={{ alignItems: 'flex-start' }}>
                                <div className="kahoot-setting-icon">
                                    <DoorOpen size={24} strokeWidth={1.85} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span className="font-semibold" style={{ display: 'block' }}>{t('kahoot.setup.allowLateJoin')}</span>
                                    <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                                        {t('kahoot.setup.allowLateJoinDesc')}
                                    </p>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={allowLateJoin}
                                        onClick={() => setAllowLateJoin(!allowLateJoin)}
                                        className="kahoot-toggle"
                                        style={{ background: allowLateJoin ? 'var(--jade)' : 'var(--color-gray-300)' }}
                                    >
                                        <span
                                            className="kahoot-toggle-knob"
                                            style={{ transform: allowLateJoin ? 'translateX(22px)' : 'translateX(2px)' }}
                                        />
                                    </button>
                                    <span className="text-sm text-secondary" style={{ marginLeft: 'var(--space-3)' }}>
                                        {allowLateJoin ? t('kahoot.setup.enabled') : t('kahoot.setup.disabled')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Launch */}
                    <div className="flex justify-center" style={{ marginTop: 'var(--space-8)' }}>
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            disabled={creating}
                            className="btn btn-primary btn-lg"
                            style={{ minWidth: '260px' }}
                        >
                            {creating ? (
                                <>
                                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                                    {t('kahoot.setup.creatingRoom')}
                                </>
                            ) : (
                                <>
                                    <Rocket size={20} strokeWidth={1.85} /> {t('kahoot.setup.launchRoom')}
                                </>
                            )}
                        </button>
                    </div>
                </section>
            )}

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .kahoot-step {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--gradient-primary);
                    color: white;
                    font-weight: 700;
                    font-size: var(--font-size-sm);
                    flex-shrink: 0;
                }
                .kahoot-quiz-card {
                    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
                }
                .kahoot-quiz-card:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-md);
                }
                .kahoot-setting-icon {
                    width: 48px;
                    height: 48px;
                    flex-shrink: 0;
                    border-radius: var(--radius-lg);
                    background: var(--color-primary-50);
                    color: var(--color-primary-500);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .kahoot-toggle {
                    position: relative;
                    width: 48px;
                    height: 26px;
                    border: none;
                    border-radius: 9999px;
                    cursor: pointer;
                    vertical-align: middle;
                    transition: background var(--transition-fast);
                }
                .kahoot-toggle-knob {
                    position: absolute;
                    top: 2px;
                    left: 0;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: transform var(--transition-fast);
                }
            `}</style>
        </div>
    );
};

export default KahootHostSetupPage;
