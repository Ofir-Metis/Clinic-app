import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

// Re-export for backward compatibility
export const api = apiClient;

// Auth response interfaces
export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  roles: string[];
  coachId?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: AuthUser;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const payload = { email, password };
  const traceId = uuidv4();
  console.info({ traceId, action: 'login', payload: { email } });
  const { data } = await apiClient.post('/auth/login', payload);
  return data;
};

export const register = async (registerData: RegisterData): Promise<AuthUser> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'register', payload: { email: registerData.email } });
  const { data } = await apiClient.post('/auth/register', registerData);
  return data;
};

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const { data } = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return !!data;
  } catch {
    return false;
  }
};
