import axios from 'axios';

export interface Appointment {
  id: number;
  therapistId: number;
  clientId: number;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'virtual';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  meetingUrl?: string;
}

export interface GetAppointmentsFilter {
  therapistId: number;
  view?: 'calendar' | 'list';
}

const api = axios.create({
  baseURL: process.env.APPOINTMENTS_SERVICE_URL,
});

export const getAppointments = async (filter: GetAppointmentsFilter) => {
  const { data } = await api.get<Appointment[]>('/appointments', { params: filter });
  return data;
};

export const getAppointment = async (id: number) => {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
};

export const updateAppointment = async (id: number, payload: Partial<Appointment>) => {
  const { data } = await api.put<Appointment>(`/appointments/${id}`, payload);
  return data;
};

export const createAppointment = async (payload: Partial<Appointment>) => {
  const { data } = await api.post<Appointment>('/appointments', payload);
  return data;
};
