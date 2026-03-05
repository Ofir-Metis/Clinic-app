import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export const fetchAppointments = (coachId?: number | string) => {
  const traceId = uuidv4();
  const params = coachId ? { coachId } : {};
  console.info({ traceId, action: 'fetchAppointments', payload: params });
  return apiClient
    .get('/dashboard/appointments', { params })
    .then((res) => res.data.data || []); // Extract nested data array
};

export const fetchNotes = (coachId?: number | string) => {
  const traceId = uuidv4();
  const params = coachId ? { coachId } : {};
  console.info({ traceId, action: 'fetchNotes', payload: params });
  return apiClient
    .get('/dashboard/notes', { params })
    .then((res) => res.data.data || []); // Extract nested data array
};

export const fetchStats = (coachId?: number | string) => {
  const traceId = uuidv4();
  const params = coachId ? { coachId } : {};
  console.info({ traceId, action: 'fetchStats', payload: params });
  return apiClient
    .get('/dashboard/stats', { params })
    .then((res) => res.data); // Stats can stay as object
};

export const fetchClientCount = async (coachId?: number | string): Promise<number> => {
  const traceId = uuidv4();
  const params = coachId ? { therapistId: coachId } : {};
  console.info({ traceId, action: 'fetchClientCount', payload: params });
  try {
    const res = await apiClient.get('/patients', { params });
    return res.data?.total || res.data?.items?.length || 0;
  } catch (error) {
    console.error('Failed to fetch client count:', error);
    return 0;
  }
};
