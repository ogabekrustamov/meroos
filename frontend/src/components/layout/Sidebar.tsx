import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    ClipboardList,
    BookOpen,
    Newspaper,
    Gamepad2,
    Trophy,
    BarChart3,
    Users,
    School,
    Settings,
    Info,
    User,
    History,
    type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts';

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const Sidebar: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Get navigation items based on user role. An unauthenticated visitor
    // ("Continue as Guest") has no user object, so we fall through to the
    // guest navigation below rather than rendering an empty sidebar.
    const getNavSections = (): NavSection[] => {
        const commonItems: NavItem[] = [
            { label: 'Dashboard', path: getDashboardPath(), icon: Home },
        ];

        switch (user?.role) {
            case 'superuser':
                return [
                    { title: 'Overview', items: commonItems },
                    {
                        title: 'Content',
                        items: [
                            { label: 'Quizzes', path: '/quizzes', icon: ClipboardList },
                            { label: 'Resources', path: '/resources', icon: BookOpen },
                            { label: 'News', path: '/news', icon: Newspaper },
                            { label: 'Kahoot', path: '/kahoot', icon: Gamepad2 },
                        ],
                    },
                    {
                        title: 'Analytics',
                        items: [
                            { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
                            { label: 'Statistics', path: '/admin/stats', icon: BarChart3 },
                        ],
                    },
                    {
                        title: 'Administration',
                        items: [
                            { label: 'Users', path: '/admin/users', icon: Users },
                            { label: 'Organizations', path: '/admin/organizations', icon: School },
                            { label: 'Settings', path: '/admin/settings', icon: Settings },
                        ],
                    },
                    {
                        title: 'More',
                        items: [{ label: 'About', path: '/about', icon: Info }],
                    },
                ];

            case 'teacher':
                const teacherSections: NavSection[] = [
                    { title: 'Overview', items: commonItems },
                    {
                        title: 'Content',
                        items: [
                            { label: 'Quizzes', path: '/quizzes', icon: ClipboardList },
                            { label: 'Resources', path: '/resources', icon: BookOpen },
                            { label: 'News', path: '/news', icon: Newspaper },
                        ],
                    },
                ];

                // Add Kahoot if has permission
                if (hasPermission('can_host_kahoot')) {
                    teacherSections[1].items.push({ label: 'Host Kahoot', path: '/kahoot/host', icon: Gamepad2 });
                }

                // Add management section if has permissions
                const managementItems: NavItem[] = [];
                if (hasPermission('can_view_student_stats')) {
                    managementItems.push({ label: 'Class Stats', path: '/teacher/class-stats', icon: BarChart3 });
                }
                if (hasPermission('can_create_students')) {
                    managementItems.push({ label: 'Students', path: '/teacher/students', icon: Users });
                }

                if (managementItems.length > 0) {
                    teacherSections.push({ title: 'Management', items: managementItems });
                }

                teacherSections.push({
                    title: 'Account',
                    items: [
                        { label: 'Profile', path: '/profile', icon: User },
                        { label: 'About', path: '/about', icon: Info },
                    ],
                });

                return teacherSections;

            case 'student':
                return [
                    { title: 'Overview', items: commonItems },
                    {
                        title: 'Learning',
                        items: [
                            { label: 'Quizzes', path: '/quizzes', icon: ClipboardList },
                            { label: 'Resources', path: '/resources', icon: BookOpen },
                            { label: 'Join Kahoot', path: '/kahoot/join', icon: Gamepad2 },
                        ],
                    },
                    {
                        title: 'Progress',
                        items: [
                            { label: 'Test History', path: '/student/quiz-history', icon: History },
                            { label: 'My Stats', path: '/profile/stats', icon: BarChart3 },
                            { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
                        ],
                    },
                    {
                        title: 'Information',
                        items: [{ label: 'News', path: '/news', icon: Newspaper }],
                    },
                    {
                        title: 'Account',
                        items: [
                            { label: 'Profile', path: '/profile', icon: User },
                            { label: 'About', path: '/about', icon: Info },
                        ],
                    },
                ];

            case 'guest':
            default:
                return [
                    { title: 'Overview', items: commonItems },
                    {
                        title: 'Explore',
                        items: [
                            { label: 'Quizzes', path: '/quizzes', icon: ClipboardList },
                            { label: 'Resources', path: '/resources', icon: BookOpen },
                            { label: 'Join Kahoot', path: '/kahoot/join', icon: Gamepad2 },
                            { label: 'News', path: '/news', icon: Newspaper },
                            { label: 'About', path: '/about', icon: Info },
                        ],
                    },
                ];
        }
    };

    const getDashboardPath = (): string => {
        switch (user?.role) {
            case 'superuser':
                return '/admin';
            case 'teacher':
                return '/teacher';
            case 'student':
                return '/student';
            default:
                return '/guest';
        }
    };

    const navSections = getNavSections();

    return (
        <aside className="sidebar">
            <div
                className="sidebar-header"
                onClick={() => navigate(getDashboardPath())}
                style={{ cursor: 'pointer' }}
                title="Go to Dashboard"
            >
                <div className="sidebar-logo">M</div>
                <span className="sidebar-title">Meroos</span>
            </div>

            <nav className="sidebar-nav">
                {navSections.map((section, idx) => (
                    <div key={idx} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive || location.pathname === item.path ? 'active' : ''}`
                                    }
                                >
                                    <span className="nav-item-icon"><Icon size={20} strokeWidth={1.85} /></span>
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
