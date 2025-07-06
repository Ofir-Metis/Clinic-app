import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetRequestPage from './ResetRequestPage';

describe('ResetRequestPage', () => {
  it('renders email field', () => {
    render(<ResetRequestPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
