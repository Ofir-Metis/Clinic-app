import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

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
