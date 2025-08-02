/**
 * Recording API service - handles recording uploads, AI summaries, and playback
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export interface RecordingUploadResponse {
  id: string;
  filename: string;
  fileSize: number;
  duration: number;
  format: string;
  uploadUrl: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  transcriptId?: string;
  summaryId?: string;
}

export interface SessionSummaryResponse {
  id: string;
  appointmentId: string;
  recordingId: string;
  keyPoints: string[];
  actionItems: string[];
  insights: string[];
  recommendations: string[];
  mood: string;
  progressNotes: string;
  nextSessionFocus: string;
  generatedAt: string;
  editedBy?: string;
  isSharedWithClient: boolean;
}

export interface TranscriptResponse {
  id: string;
  recordingId: string;
  content: string;
  speakerLabels: Array<{
    speaker: string;
    startTime: number;
    endTime: number;
    text: string;
  }>;
  generatedAt: string;
  accuracy: number;
}

export interface RecordingMetadata {
  appointmentId: string;
  sessionId: string;
  participantId: string;
  recordingMode: 'video' | 'audio' | 'screen';
  sessionType: 'in-person' | 'online' | 'hybrid';
  userId: string;
  userRole: 'coach' | 'client';
}

// Upload recording file
export const uploadRecording = async (
  file: File,
  metadata: RecordingMetadata,
  onProgress?: (progress: number) => void
): Promise<RecordingUploadResponse> => {
  const formData = new FormData();
  formData.append('recording', file);
  formData.append('metadata', JSON.stringify(metadata));

  try {
    const response = await axios.post(`${API_BASE_URL}/api/recordings/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Recording upload failed:', error);
    throw new Error('Failed to upload recording');
  }
};

// Get recordings for appointment
export const getAppointmentRecordings = async (appointmentId: string): Promise<RecordingUploadResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/appointments/${appointmentId}/recordings`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    throw new Error('Failed to load recordings');
  }
};

// Generate AI summary for recording
export const generateAISummary = async (recordingId: string): Promise<SessionSummaryResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/recordings/${recordingId}/generate-summary`);
    return response.data;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    throw new Error('Failed to generate AI summary');
  }
};

// Get existing summary
export const getRecordingSummary = async (recordingId: string): Promise<SessionSummaryResponse | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recordings/${recordingId}/summary`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // No summary exists yet
    }
    console.error('Failed to fetch summary:', error);
    throw new Error('Failed to load summary');
  }
};

// Update summary
export const updateSummary = async (
  summaryId: string, 
  updates: Partial<SessionSummaryResponse>
): Promise<SessionSummaryResponse> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/summaries/${summaryId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Summary update failed:', error);
    throw new Error('Failed to update summary');
  }
};

// Share summary with client
export const shareSummaryWithClient = async (summaryId: string, clientId: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/api/summaries/${summaryId}/share`, { clientId });
  } catch (error) {
    console.error('Failed to share summary:', error);
    throw new Error('Failed to share summary with client');
  }
};

// Generate transcript
export const generateTranscript = async (recordingId: string): Promise<TranscriptResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/recordings/${recordingId}/generate-transcript`);
    return response.data;
  } catch (error) {
    console.error('Transcript generation failed:', error);
    throw new Error('Failed to generate transcript');
  }
};

// Get transcript
export const getRecordingTranscript = async (recordingId: string): Promise<TranscriptResponse | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recordings/${recordingId}/transcript`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // No transcript exists yet
    }
    console.error('Failed to fetch transcript:', error);
    throw new Error('Failed to load transcript');
  }
};

// Delete recording
export const deleteRecording = async (recordingId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/recordings/${recordingId}`);
  } catch (error) {
    console.error('Recording deletion failed:', error);
    throw new Error('Failed to delete recording');
  }
};

// Get recording download URL
export const getRecordingDownloadUrl = async (recordingId: string): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recordings/${recordingId}/download-url`);
    return response.data.downloadUrl;
  } catch (error) {
    console.error('Failed to get download URL:', error);
    throw new Error('Failed to get recording download URL');
  }
};

// Get recording playback URL (with authentication)
export const getRecordingPlaybackUrl = async (recordingId: string): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recordings/${recordingId}/playback-url`);
    return response.data.playbackUrl;
  } catch (error) {
    console.error('Failed to get playback URL:', error);
    throw new Error('Failed to get recording playback URL');
  }
};

// Search transcript
export const searchTranscript = async (recordingId: string, query: string): Promise<Array<{
  timestamp: number;
  text: string;
  speaker: string;
}>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/recordings/${recordingId}/transcript/search`, {
      params: { query }
    });
    return response.data.results;
  } catch (error) {
    console.error('Transcript search failed:', error);
    throw new Error('Failed to search transcript');
  }
};

// Export functions for AI service integration
export const aiService = {
  generateSummary: generateAISummary,
  generateTranscript,
  searchTranscript,
};

export default {
  uploadRecording,
  getAppointmentRecordings,
  generateAISummary,
  getRecordingSummary,
  updateSummary,
  shareSummaryWithClient,
  generateTranscript,
  getRecordingTranscript,
  deleteRecording,
  getRecordingDownloadUrl,
  getRecordingPlaybackUrl,
  searchTranscript,
  aiService,
};