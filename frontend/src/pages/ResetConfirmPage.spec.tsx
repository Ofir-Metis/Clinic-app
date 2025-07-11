import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetConfirmPage from './ResetConfirmPage';
import { MemoryRouter } from 'react-router-dom';

describe('ResetConfirmPage', () => {
  it('renders new password field', () => {
    render(
      <MemoryRouter>
        <ResetConfirmPage />
      </MemoryRouter>
    );
    const newPasswordFields = screen.getAllByLabelText(/new password/i);
    expect(newPasswordFields.length).toBeGreaterThan(0);
  });
});
