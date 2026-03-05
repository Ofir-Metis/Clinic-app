import { v4 as uuidv4 } from 'uuid';
import apiClient from './client';

export interface CoachProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  specializations: string[];
  yearsOfExperience?: number;
  languages?: string[];
  timeZones?: string[];
  isAcceptingNewClients?: boolean;
  media?: Array<{
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
    isPublic: boolean;
  }>;
  verification?: {
    isVerified: boolean;
    verificationLevel?: 'basic' | 'professional' | 'premium';
  };
}

export interface SearchCoachesParams {
  search?: string;
  specializations?: string[];
  languages?: string[];
  acceptingNewClients?: boolean;
  sortBy?: 'rating' | 'experience' | 'name' | 'updated';
  page?: number;
  limit?: number;
}

export interface CoachesSearchResponse {
  profiles: CoachProfile[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Search coaches with filters
 */
export const searchCoaches = async (params?: SearchCoachesParams): Promise<CoachesSearchResponse> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'searchCoaches', payload: params });

  const { data } = await apiClient.get<CoachesSearchResponse>('/coaches', {
    params,
    headers: { 'X-Trace-Id': traceId }
  });

  return data;
};

/**
 * Get coach profile by ID
 */
export const getCoachProfile = async (id: string | number): Promise<CoachProfile> => {
  const traceId = uuidv4();
  console.info({ traceId, action: 'getCoachProfile', payload: { id } });

  const { data } = await apiClient.get<CoachProfile>(`/coaches/${id}/profile`, {
    headers: { 'X-Trace-Id': traceId }
  });

  return data;
};

/**
 * Request a connection with a coach
 */
export const requestConnection = async (
  coachId: string,
  message?: string
): Promise<any> => {
  const traceId = uuidv4();
  const clientId = localStorage.getItem('userId') || localStorage.getItem('clientId') || '';

  const payload = {
    clientId,
    coachId,
    invitationMessage: message,
    relationshipType: 'secondary', // Default to secondary coach
    dataAccessLevel: 'limited', // Default to limited access
  };

  console.info({ traceId, action: 'requestConnection', payload });

  const { data } = await apiClient.post('/relationships', payload, {
    headers: { 'X-Trace-Id': traceId }
  });

  return data;
};

/**
 * Get all relationships for the current client
 */
export const getMyRelationships = async (status?: string): Promise<any[]> => {
  const traceId = uuidv4();
  const clientId = localStorage.getItem('userId') || localStorage.getItem('clientId') || '';

  console.info({ traceId, action: 'getMyRelationships', payload: { clientId, status } });

  const params = status ? { status } : {};

  const { data } = await apiClient.get(`/relationships/client/${clientId}`, {
    params,
    headers: { 'X-Trace-Id': traceId }
  });

  return data;
};

/**
 * Accept or reject a relationship invitation
 */
export const updateRelationshipStatus = async (
  relationshipId: string,
  status: 'active' | 'terminated',
  reason?: string
): Promise<any> => {
  const traceId = uuidv4();

  const payload = {
    status,
    reason
  };

  console.info({ traceId, action: 'updateRelationshipStatus', payload: { relationshipId, ...payload } });

  const { data } = await apiClient.put(`/relationships/${relationshipId}/status`, payload, {
    headers: { 'X-Trace-Id': traceId }
  });

  return data;
};
