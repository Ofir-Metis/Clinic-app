import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const login = async (email: string, password: string) => {
  const payload = { email, password };
  const traceId = uuidv4();
  console.info({ traceId, action: 'login', payload });
  const { data } = await api.post('/auth/login', payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data as { access_token: string };
};
