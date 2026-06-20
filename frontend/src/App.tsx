import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ThemeProvider, ToastProvider } from './contexts';
import { DashboardLayout, ProtectedRoute } from './components/layout';

import './index.css';

// Every route page is lazy-loaded for route-based code splitting: the initial
// bundle holds only the app shell (providers + layout), and each feature's code
// (and its dependencies, e.g. Recharts on the admin stats page) is fetched on
// demand. The <Suspense> boundary below renders a spinner during each load.

// Auth + landing (kept out of the authenticated bundle)
const LoginPage = lazy(() => import('./pages/auth').then((m) => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('./pages/landing').then((m) => ({ default: m.LandingPage })));

// Dashboards (one chunk)
const StudentDashboard = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.StudentDashboard })));
const TeacherDashboard = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.TeacherDashboard })));
const GuestDashboard = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.GuestDashboard })));
const AdminDashboard = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.AdminDashboard })));
const ClassStatsPage = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.ClassStatsPage })));

// Quizzes (one chunk)
const QuizListPage = lazy(() => import('./pages/quizzes').then((m) => ({ default: m.QuizListPage })));
const QuizTakePage = lazy(() => import('./pages/quizzes').then((m) => ({ default: m.QuizTakePage })));
const QuizFormPage = lazy(() => import('./pages/quizzes').then((m) => ({ default: m.QuizFormPage })));

// Kahoot
const KahootJoinPage = lazy(() => import('./pages/kahoot').then((m) => ({ default: m.KahootJoinPage })));
const KahootHostSetupPage = lazy(() => import('./pages/teacher/KahootHostSetupPage'));
const KahootHostLobbyPage = lazy(() => import('./pages/teacher/KahootHostLobbyPage'));
const KahootHostGamePage = lazy(() => import('./pages/teacher/KahootHostGamePage'));

// Teacher / student
const TeacherClassesPage = lazy(() => import('./pages/teacher/TeacherClassesPage'));
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudentsPage'));
const StudentQuizHistoryPage = lazy(() => import('./pages/student/StudentQuizHistoryPage'));

// Resources / news (one chunk each)
const ResourceListPage = lazy(() => import('./pages/resources').then((m) => ({ default: m.ResourceListPage })));
const ResourceFormPage = lazy(() => import('./pages/resources').then((m) => ({ default: m.ResourceFormPage })));
const ResourceDetailPage = lazy(() => import('./pages/resources').then((m) => ({ default: m.ResourceDetailPage })));
const NewsListPage = lazy(() => import('./pages/news').then((m) => ({ default: m.NewsListPage })));
const NewsFormPage = lazy(() => import('./pages/news').then((m) => ({ default: m.NewsFormPage })));
const NewsDetailPage = lazy(() => import('./pages/news').then((m) => ({ default: m.NewsDetailPage })));

// Misc
const ProfilePage = lazy(() => import('./pages/profile').then((m) => ({ default: m.ProfilePage })));
const LeaderboardPage = lazy(() => import('./pages/leaderboard').then((m) => ({ default: m.LeaderboardPage })));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Admin (charting library stays out of the initial bundle for non-admins)
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const OrganizationManagementPage = lazy(() => import('./pages/admin/OrganizationManagementPage'));
const PlatformStatsPage = lazy(() => import('./pages/admin/PlatformStatsPage'));

// Smart redirect based on user role
const RoleBasedRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // Unauthenticated visitors land on the public marketing page.
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  switch (user?.role) {
    case 'superuser':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    default:
      return <Navigate to="/guest" replace />;
  }
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="loading-overlay"><div className="spinner spinner-lg" /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />


            {/* Smart Redirect */}
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              {/* Role-specific Dashboards */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute roles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute roles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <GuestDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student/quiz-history"
                element={
                  <ProtectedRoute roles={['student']}>
                    <StudentQuizHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Quiz Routes */}
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <QuizListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:id"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <QuizTakePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/create"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_create_quizzes">
                    <QuizFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:id/edit"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_edit_quizzes">
                    <QuizFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Kahoot Routes */}
              <Route
                path="/teacher/kahoot/setup"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_host_kahoot">
                    <KahootHostSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/kahoot/lobby/:roomCode"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_host_kahoot">
                    <KahootHostLobbyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/kahoot/game/:roomCode"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_host_kahoot">
                    <KahootHostGamePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kahoot/join"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <KahootJoinPage />
                  </ProtectedRoute>
                }
              />

              {/* Resource Routes */}
              <Route
                path="/resources"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResourceListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources/:id"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResourceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources/upload"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_upload_resources">
                    <ResourceFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources/:id/edit"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_edit_resources">
                    <ResourceFormPage />
                  </ProtectedRoute>
                }
              />

              {/* News Routes */}
              <Route
                path="/news"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <NewsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/news/:id"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <NewsDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/news/create"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_create_news">
                    <NewsFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/news/:id/edit"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_edit_news">
                    <NewsFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Profile Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage view="profile" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/stats"
                element={
                  <ProtectedRoute roles={['student']}>
                    <ProfilePage view="stats" />
                  </ProtectedRoute>
                }
              />

              {/* Leaderboard */}
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* About Page */}
              <Route
                path="/about"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <AboutPage />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Management Routes */}
              <Route
                path="/teacher/class-stats"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_view_student_stats">
                    <ClassStatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/classes"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_manage_classes">
                    <TeacherClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/students"
                element={
                  <ProtectedRoute roles={['superuser', 'teacher']} permission="can_create_students">
                    <TeacherStudentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <OrganizationManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stats"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <PlatformStatsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
