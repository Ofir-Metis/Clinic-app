import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from './AuthPage';

describe('AuthPage', () => {
  it('renders login form by default', () => {
    render(<AuthPage />);
    expect(screen.getByLabelText('login tab')).toBeInTheDocument();
    expect(screen.getByLabelText('register tab')).toBeInTheDocument();
    expect(screen.getByLabelText('login')).toBeInTheDocument();
  });

  it('switches to register form', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByLabelText('register tab'));
    expect(screen.getByLabelText('register')).toBeInTheDocument();
  });
});
