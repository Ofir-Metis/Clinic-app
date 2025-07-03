import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientListPage from './PatientListPage';

describe('PatientListPage', () => {
  it('renders loading state', () => {
    render(<PatientListPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
