import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export interface Message {
    id: string;
    threadId?: string; // Could be appointmentId or patientId
    senderId: string;
    recipientId: string;
    content: string;
    attachments?: CommentAttachment[];
    createdAt: string;
    readAt?: string;
}

export interface CommentAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
}


export const getMessages = async (threadId: string) => {
    const traceId = uuidv4();
    const { data } = await apiClient.get<Message[]>(`/communication/messages`, {
        params: { threadId },
        headers: { 'X-Trace-Id': traceId },
    });
    return data;
};

export const sendMessage = async (message: Partial<Message>) => {
    const traceId = uuidv4();
    const { data } = await apiClient.post<Message>('/communication/messages', message, {
        headers: { 'X-Trace-Id': traceId },
    });
    return data;
};

export const markAsRead = async (messageIds: string[]) => {
    const traceId = uuidv4();
    await apiClient.post('/communication/messages/read', { ids: messageIds }, {
        headers: { 'X-Trace-Id': traceId },
    });
};
