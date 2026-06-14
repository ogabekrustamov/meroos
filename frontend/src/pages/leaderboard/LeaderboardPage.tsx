import React, { useEffect, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { analyticsService } from '../../services';
import type { Leaderboard, LeaderboardEntry } from '../../types';

// Gold / silver / bronze for the top three ranks
const MEDAL_COLORS: Record<number, string> = { 1: '#FFC23C', 2: '#A9AEBA', 3: '#D08A4E' };

const LeaderboardPage: React.FC = () => {
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

    const getMedalEmoji = (rank: number): React.ReactNode => {
        if (rank >= 1 && rank <= 3) {
            return <Medal size={22} strokeWidth={1.85} color={MEDAL_COLORS[rank]} style={{ verticalAlign: 'text-bottom' }} />;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'relative', minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}><Trophy size={64} strokeWidth={1.75} color="#FFC23C" /></div>
                <h1 className="page-title">Leaderboard</h1>
                <p className="text-secondary">See how you rank against other students</p>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center gap-2" style={{ marginBottom: 'var(--space-6)' }}>
                {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
                    <button
                        key={p}
                        className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPeriod(p)}
                    >
                        {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Top 3 Podium */}
            {leaderboard && leaderboard.rankings.length >= 3 && (
                <div className="flex justify-center items-end gap-4" style={{ marginBottom: 'var(--space-8)' }}>
                    {/* 2nd Place */}
                    <div className="card text-center" style={{ width: '180px', paddingBottom: 'var(--space-4)' }}>
                        <div className="card-body">
                            <div><Medal size={48} strokeWidth={1.75} color={MEDAL_COLORS[2]} /></div>
                            <div className="avatar" style={{ margin: '0 auto var(--space-3)' }}>
                                {leaderboard.rankings[1].user.full_name.charAt(0)}
                            </div>
                            <h3 className="font-semibold">{leaderboard.rankings[1].user.full_name}</h3>
                            <p className="text-lg font-bold" style={{ color: 'var(--color-primary-600)' }}>
                                {leaderboard.rankings[1].total_points} pts
                            </p>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div
                        className="card text-center"
                        style={{
                            width: '200px',
                            paddingBottom: 'var(--space-4)',
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            transform: 'translateY(-20px)',
                        }}
                    >
                        <div className="card-body">
                            <div><Medal size={64} strokeWidth={1.75} color="#FFFFFF" /></div>
                            <div
                                className="avatar avatar-lg"
                                style={{
                                    margin: '0 auto var(--space-3)',
                                    background: 'white',
                                    color: 'var(--color-primary-600)',
                                }}
                            >
                                {leaderboard.rankings[0].user.full_name.charAt(0)}
                            </div>
                            <h3 className="font-bold">{leaderboard.rankings[0].user.full_name}</h3>
                            <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                                {leaderboard.rankings[0].total_points} pts
                            </p>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="card text-center" style={{ width: '180px', paddingBottom: 'var(--space-4)' }}>
                        <div className="card-body">
                            <div><Medal size={48} strokeWidth={1.75} color={MEDAL_COLORS[3]} /></div>
                            <div className="avatar" style={{ margin: '0 auto var(--space-3)' }}>
                                {leaderboard.rankings[2].user.full_name.charAt(0)}
                            </div>
                            <h3 className="font-semibold">{leaderboard.rankings[2].user.full_name}</h3>
                            <p className="text-lg font-bold" style={{ color: 'var(--color-primary-600)' }}>
                                {leaderboard.rankings[2].total_points} pts
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Rankings Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Rank</th>
                                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Student</th>
                                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Quizzes</th>
                                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Avg Score</th>
                                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard?.rankings.map((entry: LeaderboardEntry) => (
                                <tr
                                    key={entry.user.id}
                                    style={{
                                        borderBottom: '1px solid var(--color-border-light)',
                                        background: entry.rank <= 3 ? 'var(--color-primary-50)' : undefined,
                                    }}
                                >
                                    <td style={{ padding: 'var(--space-4)' }}>
                                        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                                            {getMedalEmoji(entry.rank) || `#${entry.rank}`}
                                        </span>
                                    </td>
                                    <td style={{ padding: 'var(--space-4)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar avatar-sm">
                                                {entry.user.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{entry.user.full_name}</div>
                                                <div className="text-sm text-muted">@{entry.user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                                        {entry.quizzes_completed}
                                    </td>
                                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                                        {entry.average_score.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'bold' }}>
                                        {entry.total_points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(!leaderboard || leaderboard.rankings.length === 0) && (
                <div className="empty-state">
                    <div className="empty-state-icon"><Trophy size={64} strokeWidth={1.75} /></div>
                    <h3 className="empty-state-title">No rankings yet</h3>
                    <p className="empty-state-description">Complete quizzes to appear on the leaderboard!</p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;
