import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetConfirmPage from './ResetConfirmPage';

describe('ResetConfirmPage', () => {
  it('renders new password field', () => {
    render(<ResetConfirmPage />);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });
});
