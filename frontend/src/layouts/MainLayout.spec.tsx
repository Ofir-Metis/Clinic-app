import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './MainLayout';

describe('MainLayout navigation', () => {
  it('shows five navigation actions', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div />
        </MainLayout>
      </BrowserRouter>
    );
    expect(screen.getAllByRole('button', { name: /dashboard|calendar|tools|notifications|settings/i })).toHaveLength(5);
  });
});
