import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewDialog from './NewDialog';
import { MemoryRouter } from 'react-router-dom';

describe('NewDialog', () => {
  it('renders when open', () => {
    render(
      <MemoryRouter>
        <NewDialog open onClose={() => {}} />
      </MemoryRouter>
    );
    const newElements = screen.getAllByText(/New/i);
    expect(newElements.length).toBeGreaterThan(0);
  });
});
