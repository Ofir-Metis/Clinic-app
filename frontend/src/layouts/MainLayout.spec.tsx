import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './MainLayout';
import CalendarPage from '../pages/CalendarPage';
import ToolsPage from '../pages/ToolsPage';

describe('MainLayout navigation', () => {
  it('shows five navigation actions', () => {
    render(
      <MemoryRouter>
        <MainLayout>
          <div />
        </MainLayout>
      </MemoryRouter>
    );
    expect(screen.getAllByRole('button', { name: /dashboard|calendar|tools|notifications|settings/i })).toHaveLength(5);
  });

  it('navigates to calendar and tools pages', async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MainLayout>
          <Routes>
            <Route path="/" element={<div>home</div>} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tools" element={<ToolsPage />} />
          </Routes>
        </MainLayout>
      </MemoryRouter>
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /calendar/i }));
    expect(screen.getByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /tools/i }));
    expect(screen.getByRole('heading', { name: /tools/i })).toBeInTheDocument();
  });
});
