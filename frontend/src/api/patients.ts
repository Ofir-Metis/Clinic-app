import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

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
  therapistId: number,
  page = 0,
  limit = 10,
  search = ''
): Promise<PatientResponse> => {
  const traceId = uuidv4();
  const params = { therapistId, page, limit, search };
  console.info({ traceId, action: 'getMyPatients', payload: params });
  const { data } = await axios.get<PatientResponse>(
    `${import.meta.env.THERAPIST_SERVICE_URL}/appointments-service/patients`,
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
  therapistId: number;
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
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/patients`,
    data,
    { headers: { 'X-Trace-Id': traceId } }
  );
  return res.data as AddPatientResponse;
}

export const searchPatients = async (search: string): Promise<PatientResponse> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'searchPatients', payload: { search } });
  const { data } = await axios.get<PatientResponse>(
    `${import.meta.env.VITE_API_URL}/patients`,
    {
      params: { search },
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};
