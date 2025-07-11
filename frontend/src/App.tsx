import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
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
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';

const PatientDetailRoute = () => {
  const { id } = useParams();
  return <PatientDetailPage id={Number(id)} />;
};

function App() {
  const token = localStorage.getItem('token');
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={token ? '/dashboard' : '/login'} replace />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/reset/request" element={<ResetRequestPage />} />
          <Route path="/reset/confirm" element={<ResetConfirmPage />} />
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route
                    path="dashboard"
                    element={(
                      <PrivateRoute>
                        <DashboardPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="patients/new"
                    element={(
                      <PrivateRoute>
                        <AddPatientPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="calendar"
                    element={(
                      <PrivateRoute>
                        <CalendarPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="tools"
                    element={(
                      <PrivateRoute>
                        <ToolsPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="settings"
                    element={(
                      <PrivateRoute>
                        <SettingsPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="notifications"
                    element={(
                      <PrivateRoute>
                        <NotificationsPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="appointments"
                    element={(
                      <PrivateRoute>
                        <AppointmentPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="appointments/new"
                    element={(
                      <PrivateRoute>
                        <AddAppointmentPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="patient/history"
                    element={(
                      <PrivateRoute>
                        <PatientHistoryPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="patient/history/:id"
                    element={(
                      <PrivateRoute>
                        <PatientHistoryPage />
                      </PrivateRoute>
                    )}
                  />
                  <Route
                    path="patients/:id"
                    element={(
                      <PrivateRoute>
                        <PatientDetailRoute />
                      </PrivateRoute>
                    )}
                  />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
