import axios from 'axios';
import { API_URL } from '../env';

const api = axios.create({ baseURL: API_URL });

export interface Notification {
  id: number;
  message: string;
  date: string;
  avatarUrl?: string;
}

export const fetchNotifications = async () => {
  const { data } = await api.get<Notification[]>('/api/notifications');
  return data;
};
