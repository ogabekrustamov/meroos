import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ThemeProvider } from './contexts';
import { DashboardLayout, ProtectedRoute } from './components/layout';

// Auth Pages
import { LoginPage } from './pages/auth';

// Dashboard Pages
import { StudentDashboard, TeacherDashboard, GuestDashboard, AdminDashboard, ClassStatsPage } from './pages/dashboard';

// Feature Pages
import { QuizListPage, QuizTakePage, QuizFormPage } from './pages/quizzes';
import { KahootJoinPage } from './pages/kahoot';
import KahootHostSetupPage from './pages/teacher/KahootHostSetupPage';
import KahootHostLobbyPage from './pages/teacher/KahootHostLobbyPage';
import KahootHostGamePage from './pages/teacher/KahootHostGamePage';
import TeacherClassesPage from './pages/teacher/TeacherClassesPage';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage';
import StudentQuizHistoryPage from './pages/student/StudentQuizHistoryPage';
import { ResourceListPage, ResourceFormPage, ResourceDetailPage } from './pages/resources';
import { NewsListPage, NewsFormPage, NewsDetailPage } from './pages/news';
import { ProfilePage } from './pages/profile';
import { LeaderboardPage } from './pages/leaderboard';
import AboutPage from './pages/AboutPage';

import './index.css';

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
      <AuthProvider>
        <Router>
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
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/stats"
                element={
                  <ProtectedRoute roles={['student']}>
                    <ProfilePage />
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
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3 className="empty-state-title">User Management</h3>
                      <p className="empty-state-description">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏫</div>
                      <h3 className="empty-state-title">Organization Management</h3>
                      <p className="empty-state-description">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stats"
                element={
                  <ProtectedRoute roles={['superuser']}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <h3 className="empty-state-title">Platform Statistics</h3>
                      <p className="empty-state-description">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
