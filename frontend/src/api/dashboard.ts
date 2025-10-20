import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { API_URL } from '../env';

const api = axios.create({ baseURL: API_URL });

export const fetchAppointments = () => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'fetchAppointments', payload: null });
  return api
    .get('/dashboard/appointments')
    .then((res) => res.data);
};

export const fetchNotes = () => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'fetchNotes', payload: null });
  return api
    .get('/dashboard/notes')
    .then((res) => res.data);
};

export const fetchStats = () => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'fetchStats', payload: null });
  return api
    .get('/dashboard/stats')
    .then((res) => res.data);
};
