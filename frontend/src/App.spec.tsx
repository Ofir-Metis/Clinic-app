import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

it('shows login form on initial load', () => {
  render(<App />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

it('renders appointment page route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/appointments');
  render(<App />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  localStorage.clear();
});

it('renders add appointment page route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/appointments/new');
  render(<App />);
  expect(screen.getByLabelText(/patient id/i)).toBeInTheDocument();
  localStorage.clear();
});

it('renders patient detail route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/patients/1');
  render(<App />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  localStorage.clear();
});
