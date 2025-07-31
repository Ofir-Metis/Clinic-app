/**
 * Session Analysis Service - API client for AI-powered session analysis
 * Handles transcription, summary generation, and coach review workflows
 */

import { apiClient } from './apiClient';
import { SessionSummary } from '../components/session-summary/SessionSummaryCard';

export interface AnalysisRequest {
  appointmentId: string;
  recordingId: string;
  coachId: string;
  clientId: string;
  audioFilePath: string;
  sessionType?: 'initial-consultation' | 'follow-up' | 'goal-setting' | 'progress-review' | 'breakthrough' | 'other';
  clientGoals?: string[];
  coachNotes?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface AnalysisResult {
  success: boolean;
  transcriptionId?: string;
  summaryId?: string;
  processingTimeMs: number;
  errors?: string[];
  warnings?: string[];
}

export interface CoachReview {
  feedback?: string;
  rating?: number;
  approved: boolean;
}

class SessionAnalysisService {
  private readonly baseUrl = '/api/session-analysis';

  async getSessionSummary(appointmentId: string): Promise<SessionSummary> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/summary/${appointmentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Session summary not found');
      }
      throw new Error(error.response?.data?.message || 'Failed to get session summary');
    }
  }

  async getSessionSummaries(params: {
    coachId?: string;
    clientId?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'session_type' | 'confidence_level';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    summaries: SessionSummary[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/summaries`, { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get session summaries');
    }
  }

  async updateCoachReview(summaryId: string, review: CoachReview): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/summary/${summaryId}/review`, review);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update coach review');
    }
  }

  async shareWithClient(summaryId: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/summary/${summaryId}/share`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to share summary with client');
    }
  }
}

export const sessionAnalysisService = new SessionAnalysisService();