/**
 * Consent API - Handles recording consent management
 */

import apiClient from './client';

export interface ConsentFeatures {
  audioRecording: boolean;
  videoRecording: boolean;
  aiAnalysis: boolean;
  transcription: boolean;
  sharing: boolean;
}

export interface RecordingConsent {
  id: string;
  appointmentId: string;
  participantId: string;
  participantRole: 'coach' | 'client';
  participantName: string;
  consentGivenAt: string;
  consentedFeatures: ConsentFeatures;
  ipAddress?: string;
  userAgent?: string;
  signatureData?: string; // Base64 encoded signature image
  revokedAt?: string;
  revokeReason?: string;
}

export interface CreateConsentRequest {
  appointmentId: string;
  participantId: string;
  participantRole: 'coach' | 'client';
  participantName: string;
  consentedFeatures: ConsentFeatures;
  signatureData?: string;
}

export interface RevokeConsentRequest {
  reason: string;
}

export interface ConsentStatusResponse {
  hasConsent: boolean;
  consent?: RecordingConsent;
  canRecord: boolean;
  missingConsents: string[]; // list of participant IDs who haven't consented
}

/**
 * Create a new recording consent record
 */
export const createConsent = async (request: CreateConsentRequest): Promise<RecordingConsent> => {
  const response = await apiClient.post('/api/consent', request);
  return response.data;
};

/**
 * Get consent status for an appointment
 */
export const getConsentStatus = async (appointmentId: string): Promise<ConsentStatusResponse> => {
  const response = await apiClient.get(`/api/consent/status/${appointmentId}`);
  return response.data;
};

/**
 * Get a specific consent record
 */
export const getConsent = async (consentId: string): Promise<RecordingConsent> => {
  const response = await apiClient.get(`/api/consent/${consentId}`);
  return response.data;
};

/**
 * Get all consents for an appointment
 */
export const getAppointmentConsents = async (appointmentId: string): Promise<RecordingConsent[]> => {
  const response = await apiClient.get(`/api/consent/appointment/${appointmentId}`);
  return response.data;
};

/**
 * Revoke a consent
 */
export const revokeConsent = async (consentId: string, request: RevokeConsentRequest): Promise<RecordingConsent> => {
  const response = await apiClient.post(`/api/consent/${consentId}/revoke`, request);
  return response.data;
};

/**
 * Verify consent is still valid (not revoked)
 */
export const verifyConsent = async (consentId: string): Promise<{ valid: boolean; reason?: string }> => {
  const response = await apiClient.get(`/api/consent/${consentId}/verify`);
  return response.data;
};

export default {
  createConsent,
  getConsentStatus,
  getConsent,
  getAppointmentConsents,
  revokeConsent,
  verifyConsent
};
