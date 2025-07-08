import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddPatientPage from './pages/AddPatientPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ResetRequestPage from './pages/ResetRequestPage';
import ResetConfirmPage from './pages/ResetConfirmPage';
import NotificationsPage from './pages/NotificationsPage';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/reset/request" element={<ResetRequestPage />} />
          <Route path="/reset/confirm" element={<ResetConfirmPage />} />
          <Route path="/patients/new" element={<AddPatientPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
