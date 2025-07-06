import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
