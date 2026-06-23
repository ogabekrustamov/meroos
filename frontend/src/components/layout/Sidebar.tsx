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
    Info,
    User,
    History,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    // Get navigation items based on user role. An unauthenticated visitor
    // ("Continue as Guest") has no user object, so we fall through to the
    // guest navigation below rather than rendering an empty sidebar.
    const getNavSections = (): NavSection[] => {
        const commonItems: NavItem[] = [
            { label: t('nav.items.dashboard'), path: getDashboardPath(), icon: Home },
        ];

        switch (user?.role) {
            case 'superuser':
                return [
                    { title: t('nav.sections.overview'), items: commonItems },
                    {
                        title: t('nav.sections.content'),
                        items: [
                            { label: t('nav.items.quizzes'), path: '/quizzes', icon: ClipboardList },
                            { label: t('nav.items.resources'), path: '/resources', icon: BookOpen },
                            { label: t('nav.items.news'), path: '/news', icon: Newspaper },
                            { label: t('nav.items.hostKahoot'), path: '/teacher/kahoot/setup', icon: Gamepad2 },
                        ],
                    },
                    {
                        title: t('nav.sections.analytics'),
                        items: [
                            { label: t('nav.items.leaderboard'), path: '/leaderboard', icon: Trophy },
                            { label: t('nav.items.statistics'), path: '/admin/stats', icon: BarChart3 },
                        ],
                    },
                    {
                        title: t('nav.sections.administration'),
                        items: [
                            { label: t('nav.items.users'), path: '/admin/users', icon: Users },
                            { label: t('nav.items.organizations'), path: '/admin/organizations', icon: School },
                            { label: t('nav.items.profile'), path: '/profile', icon: User },
                        ],
                    },
                    {
                        title: t('nav.sections.more'),
                        items: [{ label: t('nav.items.about'), path: '/about', icon: Info }],
                    },
                ];

            case 'teacher':
                const teacherSections: NavSection[] = [
                    { title: t('nav.sections.overview'), items: commonItems },
                    {
                        title: t('nav.sections.content'),
                        items: [
                            { label: t('nav.items.quizzes'), path: '/quizzes', icon: ClipboardList },
                            { label: t('nav.items.resources'), path: '/resources', icon: BookOpen },
                            { label: t('nav.items.news'), path: '/news', icon: Newspaper },
                        ],
                    },
                ];

                // Add Kahoot if has permission
                if (hasPermission('can_host_kahoot')) {
                    teacherSections[1].items.push({ label: t('nav.items.hostKahoot'), path: '/teacher/kahoot/setup', icon: Gamepad2 });
                }

                // Add management section if has permissions
                const managementItems: NavItem[] = [];
                if (hasPermission('can_view_student_stats')) {
                    managementItems.push({ label: t('nav.items.classStats'), path: '/teacher/class-stats', icon: BarChart3 });
                }
                if (hasPermission('can_create_students')) {
                    managementItems.push({ label: t('nav.items.students'), path: '/teacher/students', icon: Users });
                }

                if (managementItems.length > 0) {
                    teacherSections.push({ title: t('nav.sections.management'), items: managementItems });
                }

                teacherSections.push({
                    title: t('nav.sections.account'),
                    items: [
                        { label: t('nav.items.profile'), path: '/profile', icon: User },
                        { label: t('nav.items.about'), path: '/about', icon: Info },
                    ],
                });

                return teacherSections;

            case 'student':
                return [
                    { title: t('nav.sections.overview'), items: commonItems },
                    {
                        title: t('nav.sections.learning'),
                        items: [
                            { label: t('nav.items.quizzes'), path: '/quizzes', icon: ClipboardList },
                            { label: t('nav.items.resources'), path: '/resources', icon: BookOpen },
                            { label: t('nav.items.joinKahoot'), path: '/kahoot/join', icon: Gamepad2 },
                        ],
                    },
                    {
                        title: t('nav.sections.progress'),
                        items: [
                            { label: t('nav.items.testHistory'), path: '/student/quiz-history', icon: History },
                            { label: t('nav.items.myStats'), path: '/profile/stats', icon: BarChart3 },
                            { label: t('nav.items.leaderboard'), path: '/leaderboard', icon: Trophy },
                        ],
                    },
                    {
                        title: t('nav.sections.information'),
                        items: [{ label: t('nav.items.news'), path: '/news', icon: Newspaper }],
                    },
                    {
                        title: t('nav.sections.account'),
                        items: [
                            { label: t('nav.items.profile'), path: '/profile', icon: User },
                            { label: t('nav.items.about'), path: '/about', icon: Info },
                        ],
                    },
                ];

            case 'guest':
            default:
                return [
                    { title: t('nav.sections.overview'), items: commonItems },
                    {
                        title: t('nav.sections.explore'),
                        items: [
                            { label: t('nav.items.quizzes'), path: '/quizzes', icon: ClipboardList },
                            { label: t('nav.items.resources'), path: '/resources', icon: BookOpen },
                            { label: t('nav.items.joinKahoot'), path: '/kahoot/join', icon: Gamepad2 },
                            { label: t('nav.items.news'), path: '/news', icon: Newspaper },
                            { label: t('nav.items.about'), path: '/about', icon: Info },
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

    const goToDashboard = () => navigate(getDashboardPath());

    return (
        <aside className="sidebar">
            <div
                className="sidebar-header"
                role="link"
                tabIndex={0}
                onClick={goToDashboard}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToDashboard();
                    }
                }}
                style={{ cursor: 'pointer' }}
                aria-label={t('nav.goToDashboard')}
            >
                <div className="sidebar-logo" aria-hidden="true">M</div>
                <span className="sidebar-title">Meroos</span>
            </div>

            <nav className="sidebar-nav" aria-label={t('nav.main')}>
                {navSections.map((section, idx) => (
                    <div key={idx} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    title={item.label}
                                    aria-label={item.label}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive || location.pathname === item.path ? 'active' : ''}`
                                    }
                                >
                                    <span className="nav-item-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.85} /></span>
                                    <span className="nav-item-label">{item.label}</span>
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
