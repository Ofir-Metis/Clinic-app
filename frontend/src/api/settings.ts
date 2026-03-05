import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export const fetchSettings = () => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'fetchSettings', payload: null });
  return apiClient
    .get('/settings', { headers: { 'X-Trace-Id': traceId } })
    .then((res) => res.data);
};

export const saveSettings = (data: any[]) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'saveSettings', payload: data });
  return apiClient
    .put('/settings', data, { headers: { 'X-Trace-Id': traceId } })
    .then((res) => res.data);
};
