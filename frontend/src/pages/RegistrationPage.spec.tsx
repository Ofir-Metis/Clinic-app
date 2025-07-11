import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegistrationPage from './RegistrationPage';
import { MemoryRouter } from 'react-router-dom';

describe('RegistrationPage', () => {
  it('renders registration form fields', () => {
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );
    const fullNameFields = screen.getAllByLabelText(/full name/i);
    expect(fullNameFields.length).toBeGreaterThan(0);
    const emailFields = screen.getAllByLabelText(/email/i);
    expect(emailFields.length).toBeGreaterThan(0);
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBeGreaterThan(0);
  });
});
