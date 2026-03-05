import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export interface Appointment {
  id: number | string;
  therapistId: number | string;
  clientId: number | string;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'virtual';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  meetingUrl?: string;
  googleMeetEnabled?: boolean;
  recordings?: any[];
  aiSummary?: any;
}

export interface GetAppointmentsFilter {
  coachId: string;
  view?: 'calendar' | 'list';
}

export const getAppointments = async (filter: GetAppointmentsFilter) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointments', payload: filter });
  const { data } = await apiClient.get<{ items: Appointment[], total: number } | Appointment[]>('/appointments', {
    params: filter,
    headers: { 'X-Trace-Id': traceId },
  });
  // Handle both array and object response formats
  return Array.isArray(data) ? data : data.items;
};

export const getAppointment = async (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointment', payload: { id } });
  const { data } = await apiClient.get<Appointment>(`/appointments/${id}`, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const updateAppointment = async (id: number, payload: Partial<Appointment>) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'updateAppointment', payload });
  const { data } = await apiClient.put<Appointment>(`/appointments/${id}`, payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const createAppointment = async (payload: Partial<Appointment>) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'createAppointment', payload });
  const { data } = await apiClient.post<Appointment>('/appointments', payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const getAppointmentHistory = async (
  params: { therapistId: number; page?: number; limit?: number },
) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getAppointmentHistory', payload: params });
  const { data } = await apiClient.get<Appointment[]>('/appointments/history', {
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
  meetingType?: 'in-person' | 'online';
  location?: string;
  googleMeetEnabled?: boolean;
}

export const scheduleAppointment = async (payload: ScheduleAppointmentPayload) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'scheduleAppointment', payload });

  // Transform frontend-friendly payload to backend DTO format
  const startTime = new Date(payload.datetime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
  const therapistId = localStorage.getItem('coachId') || localStorage.getItem('userId') || '';

  const backendPayload = {
    therapistId,
    clientId: String(payload.patientId),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    title: `${payload.serviceType} session`,
    type: payload.meetingType === 'in-person' ? 'in-person' : 'virtual',
    notes: payload.notes,
    status: 'scheduled',
  };

  const { data } = await apiClient.post('/appointments', backendPayload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};
