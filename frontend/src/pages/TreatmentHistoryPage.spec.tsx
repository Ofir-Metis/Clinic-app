import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TreatmentHistoryPage from './TreatmentHistoryPage';

describe('TreatmentHistoryPage', () => {
  it('shows header', () => {
    render(<TreatmentHistoryPage user={{ id: 1 }} />);
    expect(screen.getByText(/my treatment history/i)).toBeInTheDocument();
  });
});
