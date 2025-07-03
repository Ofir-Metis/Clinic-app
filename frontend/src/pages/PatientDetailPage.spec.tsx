import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientDetailPage from './PatientDetailPage';

describe('PatientDetailPage', () => {
  it('shows loader initially', () => {
    render(<PatientDetailPage id={1} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
