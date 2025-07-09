import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

it('shows login form on initial load', () => {
  render(<App />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
