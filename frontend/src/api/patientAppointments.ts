import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export interface PatientAppointmentQuery {
  patientId: number;
  therapistId?: number;
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
}

export const getPatientAppointments = async (params: PatientAppointmentQuery) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientAppointments', payload: params });
  const { data } = await apiClient.get('/patient/appointments', {
    params,
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const getPatientAppointment = async (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientAppointment', payload: { id } });
  const { data } = await apiClient.get(`/patient/appointments/${id}`, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};
