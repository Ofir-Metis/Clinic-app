import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getPatientDetail = (id: number) =>
  api.get(`/patients/${id}`).then((r) => r.data);

export const getPatientSessions = (
  id: number,
  page = 1,
  limit = 10,
) =>
  api
    .get(`/patients/${id}/sessions`, { params: { page, limit } })
    .then((r) => r.data);

export const getPatientFiles = (id: number) =>
  api.get(`/patients/${id}/files`).then((r) => r.data);

export const getPatientBilling = (id: number) =>
  api.get(`/patients/${id}/billing`).then((r) => r.data);
