import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const fetchAppointments = () =>
  api.get('/dashboard/appointments').then((res) => res.data);

export const fetchNotes = () =>
  api.get('/dashboard/notes').then((res) => res.data);

export const fetchStats = () =>
  api.get('/dashboard/stats').then((res) => res.data);
