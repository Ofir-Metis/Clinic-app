import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data as { access_token: string };
};
