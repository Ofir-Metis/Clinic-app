import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppointmentPage from './AppointmentPage';

describe('AppointmentPage', () => {
  it('renders loading state', () => {
    render(<AppointmentPage />);
    expect(screen.getByTestId('appointments-loading')).toBeInTheDocument();
  });
});
