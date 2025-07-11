import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientLoginPage from './PatientLoginPage';
import { MemoryRouter } from 'react-router-dom';

describe('PatientLoginPage', () => {
  it('renders email and password fields', () => {
    render(
      <MemoryRouter>
        <PatientLoginPage />
      </MemoryRouter>
    );
    const emailFields = screen.getAllByLabelText(/email/i);
    expect(emailFields.length).toBeGreaterThan(0);
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBeGreaterThan(0);
  });
});
