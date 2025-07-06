import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from './SettingsPage';

jest.mock('../api/settings', () => ({
  fetchSettings: () => Promise.resolve([]),
  saveSettings: () => Promise.resolve([]),
}));

describe('SettingsPage', () => {
  it('renders language field', async () => {
    render(<SettingsPage />);
    expect(await screen.findByLabelText('Language')).toBeInTheDocument();
  });
});
