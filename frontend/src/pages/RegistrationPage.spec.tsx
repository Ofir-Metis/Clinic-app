import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegistrationPage from './RegistrationPage';

describe('RegistrationPage', () => {
  it('renders registration form fields', () => {
    render(<RegistrationPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
