import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';

// Map an exact pathname to an i18n key under the `pageTitles` namespace.
const pageTitleKeys: Record<string, string> = {
    '/admin': 'pageTitles.adminDashboard',
    '/teacher': 'pageTitles.teacherDashboard',
    '/student': 'pageTitles.studentDashboard',
    '/guest': 'pageTitles.welcome',
    '/quizzes': 'pageTitles.quizzes',
    '/quizzes/create': 'pageTitles.createQuiz',
    '/resources': 'pageTitles.resources',
    '/resources/upload': 'pageTitles.uploadResource',
    '/news': 'pageTitles.news',
    '/news/create': 'pageTitles.createPost',
    '/kahoot/host': 'pageTitles.hostKahoot',
    '/kahoot/join': 'pageTitles.joinKahoot',
    '/profile': 'pageTitles.myProfile',
    '/profile/stats': 'pageTitles.myStatistics',
    '/leaderboard': 'pageTitles.leaderboard',
    '/admin/users': 'pageTitles.userManagement',
    '/admin/organizations': 'pageTitles.organizations',
    '/admin/settings': 'pageTitles.settings',
    '/teacher/class-stats': 'pageTitles.classStatistics',
    '/teacher/students': 'pageTitles.studentManagement',
};

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();

    const getPageTitle = (): string => {
        // Exact match first
        const key = pageTitleKeys[location.pathname];
        if (key) return t(key);

        // Dynamic routes
        if (location.pathname.startsWith('/quizzes/')) return t('pageTitles.quiz');
        if (location.pathname.startsWith('/resources/')) return t('pageTitles.resource');
        if (location.pathname.startsWith('/news/')) return t('pageTitles.newsSingular');
        if (location.pathname.startsWith('/kahoot/room/')) return t('pageTitles.kahootRoom');
        return t('pageTitles.app');
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Header title={getPageTitle()} />
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
