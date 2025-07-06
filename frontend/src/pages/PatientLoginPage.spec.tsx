import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientLoginPage from './PatientLoginPage';

describe('PatientLoginPage', () => {
  it('renders email and password fields', () => {
    render(<PatientLoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
