import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

it('shows login form on initial load', () => {
  render(<App />);
  // Use getAllByLabelText to avoid ambiguity and check at least one input is present
  const emailInputs = screen.getAllByLabelText(/email/i);
  expect(emailInputs.length).toBeGreaterThan(0);
});

it('renders appointment page route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/appointments');
  render(<App />);
  // Check for the loading Skeleton by data-testid
  expect(screen.getByTestId('appointments-loading')).toBeInTheDocument();
});

it('renders add appointment page route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/appointments/new');
  render(<App />);
  // Use getAllByLabelText for patient id
  const patientIdInputs = screen.getAllByLabelText(/patient id/i);
  expect(patientIdInputs.length).toBeGreaterThan(0);
});

it('renders patient detail route', () => {
  localStorage.setItem('token', 'x');
  window.history.pushState({}, '', '/patients/1');
  render(<App />);
  expect(screen.queryByRole('progressbar')).toBeInTheDocument();
});
