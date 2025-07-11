import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { API_URL } from '../env';

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

const api = axios.create({ baseURL: API_URL });

export const getAppointments = async (filter: GetAppointmentsFilter) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointments', payload: filter });
  const { data } = await api.get<Appointment[]>('/appointments', {
    params: filter,
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const getAppointment = async (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointment', payload: { id } });
  const { data } = await api.get<Appointment>(`/appointments/${id}`, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const updateAppointment = async (id: number, payload: Partial<Appointment>) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'updateAppointment', payload });
  const { data } = await api.put<Appointment>(`/appointments/${id}`, payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const createAppointment = async (payload: Partial<Appointment>) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'createAppointment', payload });
  const { data } = await api.post<Appointment>('/appointments', payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const getAppointmentHistory = async (
  params: { therapistId: number; page?: number; limit?: number },
) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointmentHistory', payload: params });
  const { data } = await api.get<Appointment[]>('/appointments/history', {
    params,
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export interface ScheduleAppointmentPayload {
  patientId: number;
  datetime: string;
  serviceType: string;
  notes?: string;
}

export const scheduleAppointment = async (payload: ScheduleAppointmentPayload) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'scheduleAppointment', payload });
  const { data } = await api.post('/appointments', payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};
