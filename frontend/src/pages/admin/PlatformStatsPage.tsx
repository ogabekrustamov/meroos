import React, { useEffect, useState } from 'react';
import {
    Users, UserCircle, School as SchoolIcon, Activity,
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    AreaChart, Area,
} from 'recharts';
import { useTheme } from '../../contexts';
import { adminService } from '../../services';
import type { PlatformStats } from '../../types';
import './admin.css';

// Brand palette
const COBALT = '#2F55F0';
const JADE = '#14B083';
const MARIGOLD = '#FF9E1B';
const RED = '#FF515F';
const GOLD = '#FFC23C';
const GREEN = '#1FC08A';

interface MiniCard {
    label: string;
    value: number;
    icon: React.ReactNode;
}

const PlatformStatsPage: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setStats(await adminService.getPlatformStats());
            } catch (err) {
                console.error('Failed to load platform stats:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ position: 'static', minHeight: 320 }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="admin-page">
                <div className="admin-empty">
                    <div className="admin-empty-icon"><Activity size={48} strokeWidth={1.6} /></div>
                    <p>Could not load platform statistics.</p>
                </div>
            </div>
        );
    }

    // ----- KPI headline cards -----
    const kpis: MiniCard[] = [
        { label: 'Total Users', value: stats.users.total, icon: <Users size={22} strokeWidth={1.85} /> },
        { label: 'Active Users', value: stats.users.active, icon: <UserCircle size={22} strokeWidth={1.85} /> },
        { label: 'Schools', value: stats.organizations.schools, icon: <SchoolIcon size={22} strokeWidth={1.85} /> },
        { label: 'Quiz Attempts', value: stats.quizzes.attempts, icon: <Activity size={22} strokeWidth={1.85} /> },
    ];

    // ----- Users by role (pie) -----
    const roleData = [
        { name: 'Students', value: stats.users.students, color: JADE },
        { name: 'Teachers', value: stats.users.teachers, color: COBALT },
        { name: 'Admins', value: stats.users.superusers, color: RED },
        { name: 'Guests', value: stats.users.guests, color: MARIGOLD },
    ].filter((d) => d.value > 0);
    const roleTotal = roleData.reduce((sum, d) => sum + d.value, 0);

    // ----- Organizations (bar) -----
    const orgData = [
        { name: 'Regions', value: stats.organizations.regions, color: COBALT },
        { name: 'Schools', value: stats.organizations.schools, color: GREEN },
        { name: 'Classes', value: stats.organizations.classes, color: GOLD },
    ];

    // ----- 7-day activity (area) -----
    const activityData = stats.recent_activity.map((a) => ({
        date: new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' }),
        active: a.active_users,
        attempted: a.quizzes_attempted,
    }));

    // Recharts renders axis ticks / grid as SVG attributes, which don't resolve
    // CSS var()s — so we pass concrete, theme-aware colors instead.
    const axisColor = isDarkMode ? '#9CA1AD' : '#6B6F7A';
    const gridColor = isDarkMode ? '#2A2D35' : '#E6E1D6';
    const gridCursor = isDarkMode ? '#24262E' : '#EFEBE2';
    const axisStyle = { fontSize: 12, fill: axisColor };
    const tooltipStyle = {
        background: isDarkMode ? '#1D1F26' : '#FFFFFF',
        border: `1px solid ${gridColor}`,
        borderRadius: 12,
        fontSize: 13,
        color: isDarkMode ? '#ECE8DF' : '#1A1C22',
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1 className="admin-header-title">Platform Statistics</h1>
                    <p className="admin-header-subtitle">A live overview of activity across Meroos</p>
                </div>
            </div>

            {/* KPI cards */}
            <div className="admin-stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
                {kpis.map((c) => (
                    <div className="admin-mini-card" key={c.label}>
                        <div className="admin-mini-icon">{c.icon}</div>
                        <div className="admin-mini-value">{c.value.toLocaleString()}</div>
                        <div className="admin-mini-label">{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="admin-chart-grid">
                {/* Users by role — donut */}
                <div className="admin-chart-card">
                    <div className="admin-chart-title">Users by Role</div>
                    <div className="admin-chart-sub">{roleTotal.toLocaleString()} accounts total</div>
                    <div className="admin-chart-body">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={95}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {roleData.map((d) => <Cell key={d.name} fill={d.color} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="admin-chart-legend">
                        {roleData.map((d) => (
                            <div className="admin-chart-legend-item" key={d.name}>
                                <span className="admin-chart-legend-dot" style={{ background: d.color }} />
                                {d.name}
                                <span className="admin-chart-legend-value">{d.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Organizations — bar */}
                <div className="admin-chart-card">
                    <div className="admin-chart-title">Organizations</div>
                    <div className="admin-chart-sub">Regions, schools and classes</div>
                    <div className="admin-chart-body">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orgData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: gridCursor }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                                    {orgData.map((d) => <Cell key={d.name} fill={d.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 7-day activity — area */}
                <div className="admin-chart-card wide">
                    <div className="admin-chart-title">Activity — Last 7 Days</div>
                    <div className="admin-chart-sub">Active users and quiz attempts per day</div>
                    <div className="admin-chart-body">
                        {activityData.length === 0 ? (
                            <div className="admin-empty" style={{ padding: 'var(--space-8)' }}>
                                <p>No recent activity recorded yet.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COBALT} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={COBALT} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradAttempts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={JADE} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={JADE} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="active" name="Active users" stroke={COBALT} strokeWidth={2} fill="url(#gradActive)" />
                                    <Area type="monotone" dataKey="attempted" name="Quiz attempts" stroke={JADE} strokeWidth={2} fill="url(#gradAttempts)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="admin-chart-legend">
                        <div className="admin-chart-legend-item">
                            <span className="admin-chart-legend-dot" style={{ background: COBALT }} /> Active users
                        </div>
                        <div className="admin-chart-legend-item">
                            <span className="admin-chart-legend-dot" style={{ background: JADE }} /> Quiz attempts
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformStatsPage;
