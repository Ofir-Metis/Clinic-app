import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationsPage from './NotificationsPage';
import * as api from '../api/notifications';

jest.mock('../api/notifications');

describe('NotificationsPage', () => {
  it('renders notifications from API', async () => {
    (api.fetchNotifications as jest.Mock).mockResolvedValue([
      { id: 1, message: 'hello', date: new Date().toISOString() },
    ]);
    render(<NotificationsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
  });
});
