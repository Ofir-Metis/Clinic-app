import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScheduleAppointmentModal from './ScheduleAppointmentModal';

describe('ScheduleAppointmentModal', () => {
  it('renders dialog when open', () => {
    render(<ScheduleAppointmentModal open onClose={() => {}} />);
    expect(screen.getByText(/Schedule Appointment/i)).toBeInTheDocument();
  });
});
