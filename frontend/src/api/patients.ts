import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';
import { COACH_SERVICE_URL } from '../env';
import apiClient from './client';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  upcomingAppointment?: string;
}

export interface PatientResponse {
  items: Patient[];
  total: number;
}

export const getMyPatients = async (
  coachId?: string,
  page = 0,
  limit = 10,
  search = ''
): Promise<PatientResponse> => {
  const traceId = uuidv4();
  const params: Record<string, unknown> = { page, limit };
  if (coachId) params.coachId = coachId;
  if (search) params.search = search;
  console.info({ traceId, action: 'getMyPatients', payload: params });
  const { data } = await apiClient.get<PatientResponse>(
    `${COACH_SERVICE_URL}/patients`,
    {
      params,
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

export interface AddPatientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappOptIn?: boolean;
  role: string;
  therapistId: number | string;
}

export interface AddPatientResponse {
  id: number;
  existing: boolean;
}

export async function addPatient(
  data: AddPatientPayload
): Promise<AddPatientResponse> {
  const traceId = uuidv4();
  console.info({ traceId, action: 'addPatient', payload: data });
  const res = await apiClient.post(
    `${COACH_SERVICE_URL}/patients`,
    data,
    { headers: { 'X-Trace-Id': traceId } }
  );
  return res.data as AddPatientResponse;
}

export const searchPatients = async (search: string): Promise<PatientResponse> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'searchPatients', payload: { search } });
  const { data } = await apiClient.get<PatientResponse>(
    `${COACH_SERVICE_URL}/patients`,
    {
      params: { search },
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};
