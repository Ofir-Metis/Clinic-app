import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewDialog from './NewDialog';

describe('NewDialog', () => {
  it('renders when open', () => {
    render(<NewDialog open onClose={() => {}} />);
    expect(screen.getByText(/New/i)).toBeInTheDocument();
  });
});
