import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TreatmentHistoryPage from './TreatmentHistoryPage';
import * as api from '../api/appointments';

jest.mock('../api/appointments');

describe('TreatmentHistoryPage', () => {
  it('shows header', () => {
    render(<TreatmentHistoryPage user={{ id: 1 }} />);
    expect(screen.getByText(/my treatment history/i)).toBeInTheDocument();
  });
  it('opens detail drawer on row click', async () => {
    (api.getAppointmentHistory as jest.Mock).mockResolvedValue([
      { id: 1, therapistId: 1, clientId: 2, startTime: new Date().toISOString(), endTime: new Date().toISOString(), type: 'virtual', status: 'completed' },
    ]);
    (api.getAppointment as jest.Mock).mockResolvedValue({ id: 1, therapistId: 1 });
    render(<TreatmentHistoryPage user={{ id: 1 }} />);
    await waitFor(() => expect(screen.getByText(/virtual/i)).toBeInTheDocument());
    userEvent.click(screen.getByRole('row', { name: /virtual/i }));
    await waitFor(() => expect(screen.getByLabelText('treatment-detail')).toBeInTheDocument());
  });
});
