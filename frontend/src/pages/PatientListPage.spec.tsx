import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientListPage from './PatientListPage';
import * as api from '../api/patients';
import { AuthProvider } from '../AuthContext';

jest.mock('../api/patients');

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
});
