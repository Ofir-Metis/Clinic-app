import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from './DashboardPage';
import * as api from '../api/dashboard';

const navigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  useNavigate: () => navigate,
}));
jest.mock('../api/dashboard');

describe('DashboardPage', () => {
  it('shows loading initially', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('drawer links navigate', async () => {
    (api.fetchAppointments as jest.Mock).mockResolvedValue([]);
    (api.fetchNotes as jest.Mock).mockResolvedValue([]);
    (api.fetchStats as jest.Mock).mockResolvedValue({});
    render(<DashboardPage />);
    await waitFor(() => expect(api.fetchAppointments).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Calendar'));
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/calendar');
  });
});
