import axios from 'axios';
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
  const { data } = await api.get<TherapistProfile>(`/therapists/${id}/profile`);
  return data;
};

export const updateTherapistProfile = async (id: number, payload: TherapistProfile) => {
  logger.debug('update profile', payload);
  const { data } = await api.put(`/therapists/${id}/profile`, payload);
  return data;
};
