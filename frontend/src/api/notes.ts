import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export interface Note {
    id: string;
    entityId: string; // appointmentId or patientId
    entityType: 'appointment' | 'patient';
    content: string; // Markdown or raw text
    createdAt: string;
    updatedAt: string;
    isPrivate: boolean;
}

export const getNotes = async (entityId: string, entityType: 'appointment' | 'patient') => {
    const traceId = uuidv4();
    const { data } = await apiClient.get<Note[]>('/notes', {
        params: { entityId, entityType },
        headers: { 'X-Trace-Id': traceId },
    });
    return data;
};

export const saveNote = async (note: Partial<Note>) => {
    const traceId = uuidv4();
    const { data } = await apiClient.post<Note>('/notes', note, {
        headers: { 'X-Trace-Id': traceId },
    });
    return data;
};

export const updateNote = async (id: string, content: string) => {
    const traceId = uuidv4();
    const { data } = await apiClient.patch<Note>(`/notes/${id}`, { content }, {
        headers: { 'X-Trace-Id': traceId },
    });
    return data;
};
