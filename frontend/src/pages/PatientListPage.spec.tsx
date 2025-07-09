import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientListPage from './PatientListPage';
import * as api from '../api/patients';
import { AuthProvider } from '../AuthContext';

jest.mock('../api/patients');
const navigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigate,
}));

describe('PatientListPage', () => {
  it('renders loading state', () => {
    (api.getMyPatients as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    render(
      <AuthProvider userId={1}>
        <PatientListPage />
      </AuthProvider>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('queries patients with context id', async () => {
    (api.getMyPatients as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    render(
      <AuthProvider userId={7}>
        <PatientListPage />
      </AuthProvider>
    );
    await waitFor(() => expect(api.getMyPatients).toHaveBeenCalled());
    expect(api.getMyPatients).toHaveBeenCalledWith(7, 1, 10, '');
  });

  it('navigates to add patient page via FAB', async () => {
    (api.getMyPatients as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    render(
      <AuthProvider userId={1}>
        <PatientListPage />
      </AuthProvider>
    );
    await waitFor(() => expect(api.getMyPatients).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText('add-patient'));
    expect(navigate).toHaveBeenCalledWith('/patients/new');
  });

  it('navigates to add note page from row action', async () => {
    (api.getMyPatients as jest.Mock).mockResolvedValue({
      items: [{ id: 5, firstName: 'a', lastName: 'b', email: '', avatarUrl: '' }],
      total: 1,
    });
    render(
      <AuthProvider userId={1}>
        <PatientListPage />
      </AuthProvider>
    );
    await screen.findByText('a b');
    fireEvent.click(screen.getByLabelText('add-note-5'));
    expect(navigate).toHaveBeenCalledWith('/patients/5/sessions/new');
  });
});
