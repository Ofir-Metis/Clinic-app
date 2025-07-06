import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientHistoryPage from './PatientHistoryPage';

describe('PatientHistoryPage', () => {
  it('shows header', () => {
    render(<PatientHistoryPage />);
    expect(screen.getByText(/My Treatment History/i)).toBeInTheDocument();
  });
});
