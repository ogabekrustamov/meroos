import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div>
            {/* Welcome Section */}
            <div
                style={{
                    background: 'var(--gradient-dark)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-8)',
                    marginBottom: 'var(--space-8)',
                    color: 'white',
                }}
            >
                <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                    Admin Dashboard 🛡️
                </h1>
                <p style={{ opacity: 0.9 }}>
                    Welcome, {user?.first_name || user?.username}. You have full access to all platform features.
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    Administration
                </h2>
                <div className="grid grid-cols-4 gap-4">
                    <Link to="/admin/users" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body flex flex-col items-center text-center">
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    marginBottom: 'var(--space-3)',
                                }}
                            >
                                👥
                            </div>
                            <h3 className="font-semibold">Users</h3>
                            <p className="text-sm text-secondary">Manage all users</p>
                        </div>
                    </Link>

                    <Link to="/admin/organizations" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body flex flex-col items-center text-center">
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'var(--gradient-secondary)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    marginBottom: 'var(--space-3)',
                                }}
                            >
                                🏫
                            </div>
                            <h3 className="font-semibold">Organizations</h3>
                            <p className="text-sm text-secondary">Schools & Classes</p>
                        </div>
                    </Link>

                    <Link to="/quizzes" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body flex flex-col items-center text-center">
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'var(--gradient-accent)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    marginBottom: 'var(--space-3)',
                                }}
                            >
                                📝
                            </div>
                            <h3 className="font-semibold">Quizzes</h3>
                            <p className="text-sm text-secondary">All assessments</p>
                        </div>
                    </Link>

                    <Link to="/admin/stats" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body flex flex-col items-center text-center">
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    marginBottom: 'var(--space-3)',
                                }}
                            >
                                📊
                            </div>
                            <h3 className="font-semibold">Analytics</h3>
                            <p className="text-sm text-secondary">Platform statistics</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-6" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card">
                    <div className="stat-card-icon">👥</div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Total Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-secondary)' }}>
                        🏫
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Schools</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--gradient-accent)' }}>
                        📝
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Quizzes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                        📚
                    </div>
                    <div className="stat-card-value">-</div>
                    <div className="stat-card-label">Resources</div>
                </div>
            </div>

            {/* Content Management */}
            <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
                    Content Management
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    <Link to="/quizzes/create" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body">
                            <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                                📝 Create Quiz
                            </h3>
                            <p className="text-sm text-secondary">Build new assessments for students</p>
                        </div>
                    </Link>

                    <Link to="/resources/upload" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body">
                            <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                                📚 Upload Resource
                            </h3>
                            <p className="text-sm text-secondary">Add learning materials</p>
                        </div>
                    </Link>

                    <Link to="/news/create" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body">
                            <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                                📰 Create News
                            </h3>
                            <p className="text-sm text-secondary">Post announcements</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
