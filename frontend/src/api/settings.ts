import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const fetchSettings = () => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'fetchSettings', payload: null });
  return api
    .get('/settings', { headers: { 'X-Trace-Id': traceId } })
    .then((res) => res.data);
};

export const saveSettings = (data: any[]) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'saveSettings', payload: data });
  return api
    .put('/settings', data, { headers: { 'X-Trace-Id': traceId } })
    .then((res) => res.data);
};
