import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientHistoryPage from './PatientHistoryPage';
import { MemoryRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';

describe('PatientHistoryPage', () => {
  it('shows header', () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MemoryRouter>
          <PatientHistoryPage />
        </MemoryRouter>
      </LocalizationProvider>
    );
    expect(screen.getByText(/My Treatment History/i)).toBeInTheDocument();
  });
});
