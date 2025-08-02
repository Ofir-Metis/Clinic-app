import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { theme } from './theme';
import DashboardPage from './pages/DashboardPage';
import AddPatientPage from './pages/AddPatientPage';
import AddAppointmentPage from './pages/AddAppointmentPage';
import AppointmentPage from './pages/AppointmentPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import PatientDetailPage from './pages/PatientDetailPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ResetRequestPage from './pages/ResetRequestPage';
import ResetConfirmPage from './pages/ResetConfirmPage';
import NotificationsPage from './pages/NotificationsPage';
import { useParams } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import ToolsPage from './pages/ToolsPage';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/PrivateRoute';
import ClientPrivateRoute from './components/ClientPrivateRoute';
import PatientListPage from './pages/PatientListPage';
import TreatmentHistoryPage from './pages/TreatmentHistoryPage';
import PatientLoginPage from './pages/PatientLoginPage';
import TherapistProfilePage from './pages/TherapistProfilePage';
import ClientLoginPage from './pages/client/ClientLoginPage';
import ClientRegisterPage from './pages/client/ClientRegisterPage';
import ClientOnboardingPage from './pages/client/ClientOnboardingPage';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientAppointments from './pages/client/ClientAppointments';
import CoachDiscovery from './pages/client/CoachDiscovery';
import ClientGoals from './pages/client/ClientGoals';
import ClientInvitations from './pages/client/ClientInvitations';
import ClientBookingSystem from './pages/client/ClientBookingSystem';
import ClientProgressSharing from './pages/client/ClientProgressSharing';
import ClientAchievements from './pages/client/ClientAchievements';
import CoachGoalPlanningPage from './pages/CoachGoalPlanningPage';
import InvitationManagementPage from './pages/InvitationManagementPage';
import RecordingDemoPage from './pages/RecordingDemoPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ApiManagementPage from './pages/ApiManagementPage';
import SubscriptionManagementPage from './pages/admin/SubscriptionManagementPage';
import TherapistBillingPage from './pages/TherapistBillingPage';

const PatientDetailRoute = () => {
  const { id } = useParams();
  return <PatientDetailPage id={Number(id)} />;
};

function App() {
  const token = localStorage.getItem('token');
  console.log('DEBUG: token in App.tsx:', token);
  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
          />
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
          
          {/* Appointment Routes */}
          <Route path="/appointments/:id" element={<PrivateRoute><AppointmentPage /></PrivateRoute>} />
          <Route path="/appointments/new" element={<PrivateRoute><AddAppointmentPage /></PrivateRoute>} />
          
          {/* Profile Routes */}
          <Route path="/therapist/profile" element={<PrivateRoute><TherapistProfilePage /></PrivateRoute>} />
          
          {/* Coach Tools Routes */}
          <Route path="/coach/goal-planning" element={<PrivateRoute><CoachGoalPlanningPage /></PrivateRoute>} />
          <Route path="/coach/invitations" element={<PrivateRoute><InvitationManagementPage /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="/admin/api-management" element={<PrivateRoute><ApiManagementPage /></PrivateRoute>} />
          <Route path="/admin/subscriptions" element={<PrivateRoute><SubscriptionManagementPage /></PrivateRoute>} />
          
          {/* Billing Routes */}
          <Route path="/billing" element={<PrivateRoute><TherapistBillingPage /></PrivateRoute>} />
          
          {/* Client Portal Routes */}
          <Route path="/client/login" element={<ClientLoginPage />} />
          <Route path="/client/register" element={<ClientRegisterPage />} />
          <Route path="/client/onboarding" element={<ClientPrivateRoute><ClientOnboardingPage /></ClientPrivateRoute>} />
          <Route path="/client/dashboard" element={<ClientPrivateRoute><ClientDashboard /></ClientPrivateRoute>} />
          <Route path="/client/appointments" element={<ClientPrivateRoute><ClientAppointments /></ClientPrivateRoute>} />
          <Route path="/client/discover" element={<ClientPrivateRoute><CoachDiscovery /></ClientPrivateRoute>} />
          <Route path="/client/goals" element={<ClientPrivateRoute><ClientGoals /></ClientPrivateRoute>} />
          <Route path="/client/invitations" element={<ClientPrivateRoute><ClientInvitations /></ClientPrivateRoute>} />
          <Route path="/client/booking" element={<ClientPrivateRoute><ClientBookingSystem /></ClientPrivateRoute>} />
          <Route path="/client/progress" element={<ClientPrivateRoute><ClientProgressSharing /></ClientPrivateRoute>} />
          <Route path="/client/achievements" element={<ClientPrivateRoute><ClientAchievements /></ClientPrivateRoute>} />
        </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
