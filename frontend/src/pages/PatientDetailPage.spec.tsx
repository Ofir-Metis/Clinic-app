import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientDetailPage from './PatientDetailPage';
import * as api from '../api/patient';

const navigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigate,
}));
jest.mock('../api/patient');

describe('PatientDetailPage', () => {
  it('shows loader initially', () => {
    (api.getPatientDetail as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<PatientDetailPage id={1} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('navigates to new note when fab clicked on sessions tab', async () => {
    (api.getPatientDetail as jest.Mock).mockResolvedValue({ avatarUrl: '', firstName: 't', lastName: 'x', email: '' });
    (api.getPatientSessions as jest.Mock).mockResolvedValue([]);
    (api.getPatientFiles as jest.Mock).mockResolvedValue([]);
    (api.getPatientBilling as jest.Mock).mockResolvedValue([]);

    render(<PatientDetailPage id={2} />);
    await waitFor(() => expect(api.getPatientDetail).toHaveBeenCalled());
    // Click the 'sessions' tab to ensure the FAB has aria-label 'new-note'
    fireEvent.click(screen.getByRole('tab', { name: /sessions/i }));
    fireEvent.click(screen.getByLabelText('new-note'));
    expect(navigate).toHaveBeenCalledWith('/patients/2/notes/new');
  });
});
