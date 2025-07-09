import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ToolsPage from './ToolsPage';

describe('ToolsPage', () => {
  it('renders tools heading', () => {
    render(<ToolsPage />);
    expect(screen.getByRole('heading', { name: /tools/i })).toBeInTheDocument();
  });
});
