import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScheduleAppointmentModal from './ScheduleAppointmentModal';

// Mock useTranslation to return identity function for t
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key: string) => key === 'scheduleAppointment' ? 'Schedule Appointment' : key, i18n: { dir: () => 'ltr' } }),
}));

describe('ScheduleAppointmentModal', () => {
  it('renders dialog when open', () => {
    render(<ScheduleAppointmentModal open onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: /Schedule Appointment/i })).toBeInTheDocument();
  });
});
