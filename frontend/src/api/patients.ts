import axios from 'axios';
import { logger } from "../logger";

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
  const { data } = await axios.get<PatientResponse>(
    `${process.env.THERAPIST_SERVICE_URL}/appointments-service/patients`,
    {
      params: { therapistId, page, limit, search },
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

export async function addPatient(data: AddPatientPayload): Promise<AddPatientResponse> {
  logger.info('Submitting new patient', data);
  const res = await axios.post(`${process.env.VITE_API_URL}/patients`, data);
  logger.info('Received addPatient response', res.data);
  return res.data;
}
