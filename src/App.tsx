import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInstructionsPage } from './pages/student/ExamInstructionsPage';
import { ExamSessionPage } from './pages/student/ExamSessionPage';
import { ExamResultPage } from './pages/student/ExamResultPage';
import { AttemptReviewPage } from './pages/student/AttemptReviewPage';
import { StudentAnalyticsPage } from './pages/student/StudentAnalyticsPage';
import { LeaderboardPage } from './pages/student/LeaderboardPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminExamsPage } from './pages/admin/AdminExamsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminSuspiciousPage } from './pages/admin/AdminSuspiciousPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Hide Navbar & Footer during active exam session for distraction-free environment
  const isExamSession = location.pathname.includes('/session/');

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
      {!isExamSession && <Navbar />}
      <div className="flex-1 w-full max-w-full overflow-x-hidden">{children}</div>
      {!isExamSession && <Footer />}
    </div>
  );
};

const RecoveryRedirectWatcher: React.FC = () => {
  const { isPasswordRecovery } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isRecoveryRoute =
      location.pathname === '/reset-password' || location.pathname === '/update-password';
    const hasRecoveryError =
      window.location.hash.includes('error_code=otp_expired') ||
      window.location.hash.includes('type=recovery');

    if ((isPasswordRecovery || hasRecoveryError) && !isRecoveryRoute) {
      navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true });
    }
  }, [isPasswordRecovery, location.pathname, navigate]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <RecoveryRedirectWatcher />
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/update-password" element={<ResetPasswordPage />} />

              {/* Student Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <StudentAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/instructions"
                element={
                  <ProtectedRoute>
                    <ExamInstructionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/session/:attemptId"
                element={
                  <ProtectedRoute>
                    <ExamSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/result/:attemptId"
                element={
                  <ProtectedRoute>
                    <ExamResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/review/:attemptId"
                element={
                  <ProtectedRoute>
                    <AttemptReviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin / Teacher Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exams"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminExamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminQuestionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/suspicious"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSuspiciousPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
