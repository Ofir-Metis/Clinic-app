import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarPage from './CalendarPage';

describe('CalendarPage', () => {
  it('renders calendar heading', () => {
    render(<CalendarPage />);
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
  });
});
