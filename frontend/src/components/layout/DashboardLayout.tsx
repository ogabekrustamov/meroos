import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
    '/admin': 'Admin Dashboard',
    '/teacher': 'Teacher Dashboard',
    '/student': 'Student Dashboard',
    '/guest': 'Welcome',
    '/quizzes': 'Quizzes',
    '/quizzes/create': 'Create Quiz',
    '/resources': 'Resources',
    '/resources/upload': 'Upload Resource',
    '/news': 'News & Announcements',
    '/news/create': 'Create Post',
    '/kahoot/host': 'Host Kahoot',
    '/kahoot/join': 'Join Kahoot',
    '/profile': 'My Profile',
    '/profile/stats': 'My Statistics',
    '/leaderboard': 'Leaderboard',
    '/admin/users': 'User Management',
    '/admin/organizations': 'Organizations',
    '/admin/settings': 'Settings',
    '/teacher/class-stats': 'Class Statistics',
    '/teacher/students': 'Student Management',
};

const DashboardLayout: React.FC = () => {
    const location = useLocation();

    const getPageTitle = (): string => {
        // Check exact match first
        if (pageTitles[location.pathname]) {
            return pageTitles[location.pathname];
        }
        // Check for dynamic routes
        if (location.pathname.startsWith('/quizzes/')) {
            return 'Quiz';
        }
        if (location.pathname.startsWith('/resources/')) {
            return 'Resource';
        }
        if (location.pathname.startsWith('/news/')) {
            return 'News';
        }
        if (location.pathname.startsWith('/kahoot/room/')) {
            return 'Kahoot Room';
        }
        return 'Meroos';
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
