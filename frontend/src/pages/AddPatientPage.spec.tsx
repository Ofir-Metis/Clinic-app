import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddPatientPage from './AddPatientPage';

describe('AddPatientPage', () => {
  it('renders form fields', () => {
    render(<AddPatientPage therapistId={1} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
