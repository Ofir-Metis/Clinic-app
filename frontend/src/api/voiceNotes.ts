/**
 * Voice Notes API Client
 * Handles communication with the voice notes backend endpoints
 */

import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VoiceNote {
  id: string;
  coachId: string;
  appointmentId?: string;
  clientId?: string;
  linkedNoteId?: string;
  audioFileKey: string;
  audioUrl?: string;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  transcriptionStatus: TranscriptionStatus;
  transcription?: string;
  transcriptionConfidence?: number;
  languageDetected?: string;
  wordCount?: number;
  transcriptionError?: string;
  title?: string;
  tags?: string[];
  sessionTimestamp?: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  transcribedAt?: string;
}

export interface VoiceNoteListResponse {
  items: VoiceNote[];
  total: number;
}

export interface UploadVoiceNoteParams {
  audio: Blob;
  durationSeconds: number;
  appointmentId?: string;
  clientId?: string;
  title?: string;
  sessionTimestamp?: number;
  language?: string;
}

export interface UploadVoiceNoteResponse {
  id: string;
  transcriptionStatus: TranscriptionStatus;
  audioFileKey: string;
  durationSeconds: number;
  estimatedTranscriptionTime: number;
}

export interface UpdateVoiceNoteParams {
  transcription?: string;
  title?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface ConvertToNoteParams {
  entityType: 'appointment' | 'client' | 'patient';
  entityId: string;
  additionalContent?: string;
}

export interface ConvertToNoteResponse {
  noteId: string;
  voiceNoteId: string;
}

export interface VoiceNoteListParams {
  appointmentId?: string;
  clientId?: string;
  status?: TranscriptionStatus;
  search?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// Phase 5: Analytics types
export interface VoiceNoteAnalytics {
  totalVoiceNotes: number;
  totalDurationSeconds: number;
  totalWordCount: number;
  transcriptionsByStatus: Record<TranscriptionStatus, number>;
  languageBreakdown: Record<string, number>;
  averageConfidence: number;
  recentActivity: { date: string; count: number }[];
}

// Phase 5: Batch transcription response
export interface BatchTranscribeResponse {
  queued: number;
  failed: string[];
}

// Phase 5: Auto-tag response
export interface AutoTagResponse {
  tags: string[];
}

// Phase 5: Supported language
export interface SupportedLanguage {
  code: string;
  name: string;
}


/**
 * Upload a voice note audio file
 */
export const uploadVoiceNote = async (
  params: UploadVoiceNoteParams
): Promise<UploadVoiceNoteResponse> => {
  const traceId = uuidv4();
  const formData = new FormData();

  formData.append('audio', params.audio, 'voice-note.webm');
  formData.append('durationSeconds', params.durationSeconds.toString());

  if (params.appointmentId) {
    formData.append('appointmentId', params.appointmentId);
  }
  if (params.clientId) {
    formData.append('clientId', params.clientId);
  }
  if (params.title) {
    formData.append('title', params.title);
  }
  if (params.sessionTimestamp !== undefined) {
    formData.append('sessionTimestamp', params.sessionTimestamp.toString());
  }
  if (params.language) {
    formData.append('language', params.language);
  }

  const { data } = await apiClient.post<UploadVoiceNoteResponse>(
    '/voice-notes/upload',
    formData,
    {
      headers: {
        'X-Trace-Id': traceId,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data;
};

/**
 * Get list of voice notes with optional filters
 */
export const getVoiceNotes = async (
  params: VoiceNoteListParams = {}
): Promise<VoiceNoteListResponse> => {
  const traceId = uuidv4();
  const { data } = await apiClient.get<VoiceNoteListResponse>('/voice-notes', {
    params,
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

/**
 * Get a single voice note by ID
 */
export const getVoiceNote = async (id: string): Promise<VoiceNote> => {
  const traceId = uuidv4();
  const { data } = await apiClient.get<VoiceNote>(`/voice-notes/${id}`, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

/**
 * Update a voice note (transcription, title, tags)
 */
export const updateVoiceNote = async (
  id: string,
  params: UpdateVoiceNoteParams
): Promise<VoiceNote> => {
  const traceId = uuidv4();
  const { data } = await apiClient.patch<VoiceNote>(`/voice-notes/${id}`, params, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

/**
 * Delete a voice note
 */
export const deleteVoiceNote = async (id: string): Promise<void> => {
  const traceId = uuidv4();
  await apiClient.delete(`/voice-notes/${id}`, {
    headers: { 'X-Trace-Id': traceId },
  });
};

/**
 * Convert a voice note to a regular session note
 */
export const convertVoiceNoteToNote = async (
  id: string,
  params: ConvertToNoteParams
): Promise<ConvertToNoteResponse> => {
  const traceId = uuidv4();
  const { data } = await apiClient.post<ConvertToNoteResponse>(
    `/voice-notes/${id}/convert-to-note`,
    params,
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

/**
 * Retry a failed transcription
 */
export const retryTranscription = async (
  id: string
): Promise<{ message: string; voiceNoteId: string; status: string }> => {
  const traceId = uuidv4();
  const { data } = await apiClient.post<{
    message: string;
    voiceNoteId: string;
    status: string;
  }>(`/voice-notes/${id}/retry-transcription`, {}, {
    headers: { 'X-Trace-Id': traceId },
  });
  return data;
};

/**
 * Poll for transcription status updates
 */
export const pollTranscriptionStatus = async (
  id: string,
  onUpdate: (voiceNote: VoiceNote) => void,
  options: { interval?: number; maxAttempts?: number } = {}
): Promise<VoiceNote> => {
  const { interval = 3000, maxAttempts = 60 } = options;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const voiceNote = await getVoiceNote(id);
        onUpdate(voiceNote);

        if (
          voiceNote.transcriptionStatus === 'completed' ||
          voiceNote.transcriptionStatus === 'failed'
        ) {
          resolve(voiceNote);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Transcription polling timeout'));
          return;
        }

        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

// ============ Phase 5: Advanced Features ============

/**
 * Get voice notes analytics summary
 */
export const getVoiceNotesAnalytics = async (
  days: number = 30
): Promise<VoiceNoteAnalytics> => {
  const traceId = uuidv4();
  const { data } = await apiClient.get<VoiceNoteAnalytics>(
    '/voice-notes/analytics/summary',
    {
      params: { days },
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

/**
 * Batch transcribe multiple voice notes
 */
export const batchTranscribe = async (
  voiceNoteIds: string[]
): Promise<BatchTranscribeResponse> => {
  const traceId = uuidv4();
  const { data } = await apiClient.post<BatchTranscribeResponse>(
    '/voice-notes/batch/transcribe',
    { voiceNoteIds },
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

/**
 * Auto-generate tags for a voice note based on transcription
 */
export const autoTagVoiceNote = async (id: string): Promise<AutoTagResponse> => {
  const traceId = uuidv4();
  const { data } = await apiClient.post<AutoTagResponse>(
    `/voice-notes/${id}/auto-tag`,
    {},
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

/**
 * Get list of supported transcription languages
 */
export const getSupportedLanguages = async (): Promise<SupportedLanguage[]> => {
  const traceId = uuidv4();
  const { data } = await apiClient.get<SupportedLanguage[]>(
    '/voice-notes/config/languages',
    {
      headers: { 'X-Trace-Id': traceId },
    }
  );
  return data;
};

/**
 * Search voice notes with full-text search
 */
export const searchVoiceNotes = async (
  searchQuery: string,
  options: Omit<VoiceNoteListParams, 'search'> = {}
): Promise<VoiceNoteListResponse> => {
  return getVoiceNotes({ ...options, search: searchQuery });
};

/**
 * Get voice notes filtered by language
 */
export const getVoiceNotesByLanguage = async (
  language: string,
  options: Omit<VoiceNoteListParams, 'language'> = {}
): Promise<VoiceNoteListResponse> => {
  return getVoiceNotes({ ...options, language });
};

/**
 * Get voice notes within a date range
 */
export const getVoiceNotesByDateRange = async (
  dateFrom: Date,
  dateTo: Date,
  options: Omit<VoiceNoteListParams, 'dateFrom' | 'dateTo'> = {}
): Promise<VoiceNoteListResponse> => {
  return getVoiceNotes({
    ...options,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  });
};
