import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddPatientPage from './AddPatientPage';

describe('AddPatientPage', () => {
  it('renders form fields', () => {
    render(<AddPatientPage therapistId={1} />);
    expect(screen.getByLabelText(/firstName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lastName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
