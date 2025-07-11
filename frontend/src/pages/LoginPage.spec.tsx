import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import { MemoryRouter } from 'react-router-dom';

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const emailFields = screen.getAllByLabelText(/email/i);
    expect(emailFields.length).toBeGreaterThan(0);
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBeGreaterThan(0);
  });
});
