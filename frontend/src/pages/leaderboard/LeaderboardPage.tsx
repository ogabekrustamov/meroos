import React, { useEffect, useState } from 'react';
import {
    Trophy, Crown, Medal, Award, Flame, Target, ListChecks, ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../../services';
import { useAuth } from '../../contexts';
import type { Leaderboard, LeaderboardEntry } from '../../types';

// Podium palettes for the top three ranks (gold / silver / bronze).
const PODIUM = {
    1: { ring: '#FFC23C', soft: 'rgba(255, 194, 60, 0.16)', labelKey: 'leaderboard.champion' },
    2: { ring: '#A9AEBA', soft: 'rgba(169, 174, 186, 0.16)', labelKey: 'leaderboard.runnerUp' },
    3: { ring: '#D08A4E', soft: 'rgba(208, 138, 78, 0.16)', labelKey: 'leaderboard.thirdPlace' },
} as const;

const PERIODS = [
    { key: 'weekly', labelKey: 'leaderboard.weekly' },
    { key: 'monthly', labelKey: 'leaderboard.monthly' },
    { key: 'all_time', labelKey: 'leaderboard.allTime' },
] as const;

const initials = (name: string): string =>
    name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';

const LeaderboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('all_time');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await analyticsService.getLeaderboard({ type: period });
                setLeaderboard(data);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [period]);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    const rankings = leaderboard?.rankings ?? [];
    const hasPodium = rankings.length >= 3;
    const podium = rankings.slice(0, 3);
    // Reorder the podium as [2nd, 1st, 3rd] so the champion sits centered & raised.
    const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as LeaderboardEntry[];
    // When a podium is shown, the list covers ranks 4+; otherwise it lists everyone.
    const listEntries = hasPodium ? rankings.slice(3) : rankings;

    const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
        if (rank === 1) return <Crown size={18} strokeWidth={2} color={PODIUM[1].ring} />;
        if (rank === 2) return <Medal size={18} strokeWidth={2} color={PODIUM[2].ring} />;
        if (rank === 3) return <Award size={18} strokeWidth={2} color={PODIUM[3].ring} />;
        return <span className="lb-rank-num">{rank}</span>;
    };

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                <div className="lb-header-icon">
                    <Trophy size={34} strokeWidth={1.85} />
                </div>
                <h1 className="page-title" style={{ marginBottom: 'var(--space-1)' }}>{t('leaderboard.title')}</h1>
                <p className="text-secondary">{t('leaderboard.subtitle')}</p>
            </div>

            {/* Period segmented control */}
            <div className="lb-segment" role="tablist" aria-label={t('leaderboard.periodAria')}>
                {PERIODS.map((p) => (
                    <button
                        key={p.key}
                        role="tab"
                        aria-selected={period === p.key}
                        className={`lb-segment-btn ${period === p.key ? 'is-active' : ''}`}
                        onClick={() => setPeriod(p.key)}
                    >
                        {t(p.labelKey)}
                    </button>
                ))}
            </div>

            {rankings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Trophy size={64} strokeWidth={1.75} /></div>
                    <h3 className="empty-state-title">{t('leaderboard.noRankingsTitle')}</h3>
                    <p className="empty-state-description">{t('leaderboard.noRankingsDesc')}</p>
                </div>
            ) : (
                <>
                    {/* Podium (top 3) */}
                    {hasPodium && (
                        <div className="lb-podium">
                            {podiumOrder.map((entry) => {
                                const meta = PODIUM[entry.rank as 1 | 2 | 3];
                                const isFirst = entry.rank === 1;
                                const isMe = user?.id === entry.user.id;
                                return (
                                    <div
                                        key={entry.user.id}
                                        className={`card lb-podium-card ${isFirst ? 'lb-podium-card--first' : ''}`}
                                        style={{ borderTop: `3px solid ${meta.ring}` }}
                                    >
                                        <div className="card-body text-center" style={{ position: 'relative' }}>
                                            <span className="lb-podium-rank" style={{ background: meta.soft, color: meta.ring }}>
                                                {isFirst
                                                    ? <Crown size={20} strokeWidth={2} />
                                                    : entry.rank === 2
                                                        ? <Medal size={20} strokeWidth={2} />
                                                        : <Award size={20} strokeWidth={2} />}
                                            </span>

                                            <div
                                                className={`avatar ${isFirst ? 'avatar-lg' : ''} lb-podium-avatar`}
                                                style={{ boxShadow: `0 0 0 3px ${meta.soft}, 0 0 0 4px ${meta.ring}` }}
                                            >
                                                {initials(entry.user.full_name)}
                                            </div>

                                            <div className="lb-podium-place" style={{ color: meta.ring }}>{t(meta.labelKey)}</div>
                                            <h3 className={`lb-podium-name ${isFirst ? 'font-bold' : 'font-semibold'}`} style={{ marginBottom: 'var(--space-1)' }}>
                                                {entry.user.full_name}
                                                {isMe && <span className="lb-you-tag">{t('leaderboard.you')}</span>}
                                            </h3>
                                            <p className="lb-podium-username text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
                                                @{entry.user.username}
                                            </p>

                                            <div className="lb-podium-points">
                                                <Flame size={isFirst ? 22 : 18} strokeWidth={1.85} color="var(--color-accent-500)" />
                                                <span style={{ fontSize: isFirst ? 'var(--font-size-2xl)' : 'var(--font-size-xl)', fontWeight: 800 }}>
                                                    {entry.total_points.toLocaleString()}
                                                </span>
                                                <span className="text-sm text-muted">{t('leaderboard.pts')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Full rankings list */}
                    {listEntries.length > 0 && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="lb-list-head">
                            <span style={{ width: '44px' }}>{t('leaderboard.colRank')}</span>
                            <span style={{ flex: 1 }}>{t('leaderboard.colStudent')}</span>
                            <span className="lb-col-stat"><ListChecks size={14} strokeWidth={2} /> {t('leaderboard.colQuizzes')}</span>
                            <span className="lb-col-stat"><Target size={14} strokeWidth={2} /> {t('leaderboard.colAvg')}</span>
                            <span className="lb-col-points"><Flame size={14} strokeWidth={2} /> {t('leaderboard.colPoints')}</span>
                        </div>

                        {listEntries.map((entry: LeaderboardEntry) => {
                            const isMe = user?.id === entry.user.id;
                            const isTop3 = entry.rank <= 3;
                            return (
                                <div
                                    key={entry.user.id}
                                    className={`lb-row ${isMe ? 'lb-row--me' : ''} ${isTop3 ? 'lb-row--top' : ''}`}
                                >
                                    <span className="lb-row-rank"><RankBadge rank={entry.rank} /></span>

                                    <div className="lb-row-student">
                                        <div className="avatar avatar-sm">{initials(entry.user.full_name)}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="font-medium lb-truncate">
                                                {entry.user.full_name}
                                                {isMe && <span className="lb-you-tag">{t('leaderboard.you')}</span>}
                                            </div>
                                            <div className="text-sm text-muted lb-truncate">@{entry.user.username}</div>
                                        </div>
                                    </div>

                                    <span className="lb-col-stat">{entry.quizzes_completed}</span>
                                    <span className="lb-col-stat">{entry.average_score.toFixed(1)}%</span>
                                    <span className="lb-col-points">
                                        <ChevronUp size={14} strokeWidth={2.5} color="var(--jade)" style={{ opacity: isTop3 ? 1 : 0 }} />
                                        <strong>{entry.total_points.toLocaleString()}</strong>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </>
            )}

            <style>{`
                .lb-header-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 72px;
                    height: 72px;
                    border-radius: var(--radius-full);
                    margin-bottom: var(--space-4);
                    color: #fff;
                    background: linear-gradient(135deg, #FFC23C, #F37A0C);
                    box-shadow: 0 10px 26px rgba(243, 122, 12, 0.3);
                }

                /* Segmented period control */
                .lb-segment {
                    display: inline-flex;
                    gap: 4px;
                    padding: 4px;
                    margin: 0 auto var(--space-8);
                    background: var(--color-gray-100);
                    border-radius: var(--radius-full);
                    width: max-content;
                    max-width: 100%;
                    left: 50%;
                    position: relative;
                    transform: translateX(-50%);
                }
                .lb-segment-btn {
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary);
                    font-weight: 600;
                    font-size: var(--font-size-sm);
                    padding: var(--space-2) var(--space-5);
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .lb-segment-btn:hover { color: var(--color-text-primary); }
                .lb-segment-btn.is-active {
                    background: var(--color-surface);
                    color: var(--color-primary-600);
                    box-shadow: var(--shadow-sm);
                }

                /* Podium */
                .lb-podium {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    align-items: end;
                    gap: var(--space-4);
                    margin-bottom: var(--space-8);
                }
                .lb-podium-card { border-radius: var(--radius-xl); }
                .lb-podium-card--first { transform: translateY(-18px); box-shadow: var(--shadow-lg); }
                .lb-podium-rank {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-full);
                    margin-bottom: var(--space-3);
                }
                .lb-podium-avatar { margin: 0 auto var(--space-3); }
                .lb-podium-place {
                    font-size: var(--font-size-xs);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: var(--space-1);
                }
                .lb-podium-points {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                /* "You" tag */
                .lb-you-tag {
                    display: inline-block;
                    margin-left: var(--space-2);
                    padding: 1px 8px;
                    font-size: 0.68rem;
                    font-weight: 700;
                    color: var(--color-primary-600);
                    background: var(--color-primary-50);
                    border-radius: var(--radius-full);
                    vertical-align: middle;
                }

                /* List header + rows */
                .lb-list-head {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                    padding: var(--space-3) var(--space-5);
                    border-bottom: 1px solid var(--color-border);
                    font-size: var(--font-size-xs);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--color-text-muted);
                }
                .lb-row {
                    display: flex;
                    align-items: center;
                    gap: var(--space-4);
                    padding: var(--space-3) var(--space-5);
                    border-bottom: 1px solid var(--color-border-light);
                    transition: background var(--transition-fast);
                }
                .lb-row:last-child { border-bottom: none; }
                .lb-row:hover { background: var(--color-gray-50); }
                .lb-row--top { background: var(--color-primary-50); }
                .lb-row--me {
                    background: var(--color-primary-50);
                    box-shadow: inset 3px 0 0 var(--color-primary-500);
                }
                .lb-row-rank {
                    width: 44px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .lb-rank-num { font-weight: 700; color: var(--color-text-secondary); }
                .lb-row-student {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    min-width: 0;
                }
                .lb-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .lb-col-stat {
                    width: 88px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    color: var(--color-text-secondary);
                    font-weight: 500;
                }
                .lb-col-points {
                    width: 104px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    font-size: var(--font-size-lg);
                }

                /* Keep the podium names from overflowing their column */
                .lb-podium-name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                }

                @media (max-width: 640px) {
                    .lb-col-stat { display: none; }
                    .lb-podium { gap: var(--space-2); }
                    .lb-podium-card--first { transform: none; }

                    /* Compact the podium so three cards still fit a phone width */
                    .lb-podium-card .card-body { padding: var(--space-3) var(--space-2); }
                    .lb-podium-avatar { width: 44px; height: 44px; font-size: var(--font-size-sm); }
                    .lb-podium-username { display: none; }
                    .lb-podium-place { font-size: 0.6rem; }
                    .lb-podium-points span { font-size: var(--font-size-base) !important; }
                    .lb-you-tag { display: none; }
                }

                /* Very narrow phones: stack the podium into a single column,
                   ordered champion → runner-up → third. */
                @media (max-width: 420px) {
                    .lb-podium { grid-template-columns: 1fr; }
                    .lb-podium-card--first { order: -1; }
                    .lb-podium-username { display: block; }
                }
            `}</style>
        </div>
    );
};

export default LeaderboardPage;
