import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { theme } from './theme';
import { useParams } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import ClientPrivateRoute from './components/ClientPrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';
import AuthGuard from './components/AuthGuard';
import WellnessLayout from './layouts/WellnessLayout';

// Critical pages loaded immediately (no lazy loading for initial user experience)
import LoginPage from './pages/LoginPage';
import ClientLoginPage from './pages/client/ClientLoginPage';
import RootRedirect from './components/RootRedirect';

// Lazy load all other pages to reduce initial bundle size
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AddPatientPage = React.lazy(() => import('./pages/AddPatientPage'));
const AddNotePage = React.lazy(() => import('./pages/AddNotePage'));
const AddAppointmentPage = React.lazy(() => import('./pages/AddAppointmentPage'));
const AppointmentPage = React.lazy(() => import('./pages/AppointmentPage'));
const PatientHistoryPage = React.lazy(() => import('./pages/PatientHistoryPage'));
const PatientDetailPage = React.lazy(() => import('./pages/PatientDetailPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const RegistrationPage = React.lazy(() => import('./pages/RegistrationPage'));
const ResetRequestPage = React.lazy(() => import('./pages/ResetRequestPage'));
const ResetConfirmPage = React.lazy(() => import('./pages/ResetConfirmPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const ToolsPage = React.lazy(() => import('./pages/ToolsPage'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const PatientListPage = React.lazy(() => import('./pages/PatientListPage'));
const TreatmentHistoryPage = React.lazy(() => import('./pages/TreatmentHistoryPage'));
const PatientLoginPage = React.lazy(() => import('./pages/PatientLoginPage'));
const TherapistProfilePage = React.lazy(() => import('./pages/TherapistProfilePage'));

// Client portal pages
const ClientRegisterPage = React.lazy(() => import('./pages/client/ClientRegisterPage'));
const ClientForgotPasswordPage = React.lazy(() => import('./pages/client/ClientForgotPasswordPage'));
const ClientSettingsPage = React.lazy(() => import('./pages/client/ClientSettingsPage'));
const ClientOnboardingPage = React.lazy(() => import('./pages/client/ClientOnboardingPage'));
const ClientDashboard = React.lazy(() => import('./pages/client/ClientDashboard'));
const ClientAppointments = React.lazy(() => import('./pages/client/ClientAppointments'));
const CoachDiscovery = React.lazy(() => import('./pages/client/CoachDiscovery'));
const ClientGoals = React.lazy(() => import('./pages/client/ClientGoals'));
const ClientInvitations = React.lazy(() => import('./pages/client/ClientInvitations'));
const ClientBookingSystem = React.lazy(() => import('./pages/client/ClientBookingSystem'));
const ClientProgressSharing = React.lazy(() => import('./pages/client/ClientProgressSharing'));
const ClientAchievements = React.lazy(() => import('./pages/client/ClientAchievements'));

// Coach and admin pages
const CoachGoalPlanningPage = React.lazy(() => import('./pages/CoachGoalPlanningPage'));
const InvitationManagementPage = React.lazy(() => import('./pages/InvitationManagementPage'));
const RecordingDemoPage = React.lazy(() => import('./pages/RecordingDemoPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const ApiManagementPage = React.lazy(() => import('./pages/ApiManagementPage'));
const SubscriptionManagementPage = React.lazy(() => import('./pages/admin/SubscriptionManagementPage'));
const TherapistBillingPage = React.lazy(() => import('./pages/TherapistBillingPage'));

// Loading component for suspense fallback
const LoadingSpinner = () => <LoadingSkeleton variant="default" />;

const PatientDetailRoute = () => {
  const { id } = useParams();
  return <PatientDetailPage id={Number(id)} />;
};

// Profile route wrapper - uses current user's ID from auth context
const ProfileRoute = () => {
  const { user, userId } = useAuth();
  // Use userId from context or parse from user.id
  const profileId = userId || (user?.id ? parseInt(user.id, 10) : 1);
  return <TherapistProfilePage id={profileId} />;
};

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <BrowserRouter>
              <AuthGuard>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/reset/request" element={<ResetRequestPage />} />
          <Route path="/reset/confirm" element={<ResetConfirmPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><PatientListPage /></PrivateRoute>} />
          <Route path="/tools" element={<PrivateRoute><ToolsPage /></PrivateRoute>} />
          <Route path="/recording-demo" element={<PrivateRoute><RecordingDemoPage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          
          {/* Patient Routes */}
          <Route path="/patients/new" element={<PrivateRoute><AddPatientPage /></PrivateRoute>} />
          <Route path="/patients/:id" element={<PrivateRoute><PatientDetailRoute /></PrivateRoute>} />
          <Route path="/patients/:id/history" element={<PrivateRoute><PatientHistoryPage /></PrivateRoute>} />
          <Route path="/patients/:id/treatments" element={<PrivateRoute><TreatmentHistoryPage /></PrivateRoute>} />
          <Route path="/patients/:id/login" element={<PrivateRoute><PatientLoginPage /></PrivateRoute>} />
          <Route path="/patients/:id/notes/new" element={<PrivateRoute><AddNotePage /></PrivateRoute>} />

          {/* Appointment Routes */}
          <Route path="/appointments" element={<Navigate to="/calendar" replace />} />
          <Route path="/appointments/:id" element={<PrivateRoute><AppointmentPage /></PrivateRoute>} />
          <Route path="/appointments/new" element={<PrivateRoute><AddAppointmentPage /></PrivateRoute>} />
          
          {/* Profile Routes */}
          <Route path="/profile" element={<PrivateRoute><ProfileRoute /></PrivateRoute>} />
          <Route path="/therapist/profile" element={<PrivateRoute><ProfileRoute /></PrivateRoute>} />
          
          {/* Coach Tools Routes */}
          <Route path="/coach/goal-planning" element={<PrivateRoute><CoachGoalPlanningPage /></PrivateRoute>} />
          <Route path="/coach/invitations" element={<PrivateRoute><InvitationManagementPage /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="/admin/api-management" element={<PrivateRoute><ApiManagementPage /></PrivateRoute>} />
          <Route path="/admin/subscriptions" element={<PrivateRoute><SubscriptionManagementPage /></PrivateRoute>} />
          
          {/* Billing Routes */}
          <Route path="/billing" element={<PrivateRoute><TherapistBillingPage /></PrivateRoute>} />
          
          {/* Client Portal Routes */}
          <Route path="/client/login" element={<ClientLoginPage />} />
          <Route path="/client/register" element={<ClientRegisterPage />} />
          <Route path="/client/forgot-password" element={<ClientForgotPasswordPage />} />
          <Route path="/client/settings" element={<ClientPrivateRoute><WellnessLayout><ClientSettingsPage /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/onboarding" element={<ClientPrivateRoute><ClientOnboardingPage /></ClientPrivateRoute>} />
          <Route path="/client/dashboard" element={<ClientPrivateRoute><WellnessLayout><ClientDashboard /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/appointments" element={<ClientPrivateRoute><WellnessLayout><ClientAppointments /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/discover" element={<ClientPrivateRoute><WellnessLayout><CoachDiscovery /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/discover-coaches" element={<Navigate to="/client/discover" replace />} />
          <Route path="/client/goals" element={<ClientPrivateRoute><WellnessLayout><ClientGoals /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/invitations" element={<ClientPrivateRoute><WellnessLayout><ClientInvitations /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/booking" element={<ClientPrivateRoute><WellnessLayout><ClientBookingSystem /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/progress" element={<ClientPrivateRoute><WellnessLayout><ClientProgressSharing /></WellnessLayout></ClientPrivateRoute>} />
          <Route path="/client/achievements" element={<ClientPrivateRoute><WellnessLayout><ClientAchievements /></WellnessLayout></ClientPrivateRoute>} />
                  </Routes>
                </Suspense>
              </AuthGuard>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
