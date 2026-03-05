import apiClient from './client';

export interface Notification {
  id: number;
  message: string;
  date: string;
  avatarUrl?: string;
}

export const fetchNotifications = async () => {
  const { data } = await apiClient.get<Notification[]>('/notifications');
  return data;
};
