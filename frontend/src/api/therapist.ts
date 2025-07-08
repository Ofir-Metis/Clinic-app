import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export interface TherapistProfile {
  userId: number;
  name: string;
  title: string;
  bio: string;
  services: any[];
  media: any[];
}

export const getTherapistProfile = async (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getTherapistProfile', payload: { id } });
  const { data } = await api.get<TherapistProfile>(`/therapists/${id}/profile`, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

export const updateTherapistProfile = async (id: number, payload: TherapistProfile) => {
  logger.debug('update profile', payload);
  const traceId = uuidv4();
  console.info({ traceId, action: 'updateTherapistProfile', payload });
  const { data } = await api.put(`/therapists/${id}/profile`, payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};
