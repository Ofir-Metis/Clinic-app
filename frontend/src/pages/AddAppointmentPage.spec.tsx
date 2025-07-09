import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddAppointmentPage from './AddAppointmentPage';

describe('AddAppointmentPage', () => {
  it('renders patient id field', () => {
    render(<AddAppointmentPage />);
    expect(screen.getByLabelText(/patient id/i)).toBeInTheDocument();
  });
});
