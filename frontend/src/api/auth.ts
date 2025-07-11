import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { API_URL } from '../env';

const api = axios.create({ baseURL: API_URL });

export { api };
export const login = async (email: string, password: string) => {
  const payload = { email, password };
  const traceId = uuidv4();
  console.info({ traceId, action: 'login', payload });
  const { data } = await api.post('/auth/login', payload, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data as { access_token: string };
};
