import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const fetchSettings = () =>
  api.get('/settings').then((res) => res.data);

export const saveSettings = (data: any[]) =>
  api.put('/settings', data).then((res) => res.data);
