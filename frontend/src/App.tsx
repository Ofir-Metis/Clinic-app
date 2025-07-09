import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import DashboardPage from './pages/DashboardPage';
import AddPatientPage from './pages/AddPatientPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ResetRequestPage from './pages/ResetRequestPage';
import ResetConfirmPage from './pages/ResetConfirmPage';
import NotificationsPage from './pages/NotificationsPage';
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const token = localStorage.getItem('token');
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
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
              path="/dashboard"
              element={(
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              )}
            />
            <Route
              path="/patients/new"
              element={(
                <PrivateRoute>
                  <AddPatientPage />
                </PrivateRoute>
              )}
            />
            <Route
              path="/settings"
              element={(
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              )}
            />
            <Route
              path="/notifications"
              element={(
                <PrivateRoute>
                  <NotificationsPage />
                </PrivateRoute>
              )}
            />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
