import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  it('shows loading initially', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
