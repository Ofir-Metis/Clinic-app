import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TherapistProfilePage from './TherapistProfilePage';
import * as api from '../api/therapist';

jest.mock('../api/therapist');

describe('TherapistProfilePage', () => {
  it('shows edit toggle for owner', async () => {
    (api.getTherapistProfile as jest.Mock).mockResolvedValue({
      userId: 1,
      name: 'Dr A',
      title: 'Therapist',
      bio: '',
      services: [],
      media: [],
    });
    localStorage.setItem('token',
      [
        '',
        btoa(JSON.stringify({ sub: 1 })),
        ''
      ].join('.'));
    render(<TherapistProfilePage id={1} />);
    await waitFor(() => expect(screen.getByLabelText('edit')).toBeInTheDocument(), { timeout: 15000 });
  });
});
