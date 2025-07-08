import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getPatientDetail = (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientDetail', payload: { id } });
  return api
    .get(`/patients/${id}`, { headers: { 'X-Trace-Id': traceId } })
    .then((r) => r.data);
};

export const getPatientSessions = (
  id: number,
  page = 1,
  limit = 10,
) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientSessions', payload: { id, page, limit } });
  return api
    .get(`/patients/${id}/sessions`, {
      params: { page, limit },
      headers: { 'X-Trace-Id': traceId },
    })
    .then((r) => r.data);
};

export const getPatientFiles = (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientFiles', payload: { id } });
  return api
    .get(`/patients/${id}/files`, { headers: { 'X-Trace-Id': traceId } })
    .then((r) => r.data);
};

export const getPatientBilling = (id: number) => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getPatientBilling', payload: { id } });
  return api
    .get(`/patients/${id}/billing`, { headers: { 'X-Trace-Id': traceId } })
    .then((r) => r.data);
};
