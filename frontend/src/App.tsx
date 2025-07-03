import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddPatientPage from './pages/AddPatientPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patients/new" element={<AddPatientPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
