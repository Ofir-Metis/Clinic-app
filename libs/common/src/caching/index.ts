/**
 * Caching module exports
 * 
 * Comprehensive Redis-based caching solution with healthcare compliance,
 * HIPAA encryption, performance monitoring, and production-ready features.
 */

// Core services
export * from './cache-manager.service';
export * from './cache.interceptor';
export * from './cache.module';

// Import types for internal use
import type { CacheStats } from './cache-manager.service';

// Decorators and utilities
export * from './cache.decorator';

// Types and interfaces
export type {
  CacheConfig,
  CacheStats,
  CacheKey,
  CacheStrategy
} from './cache-manager.service';

export type {
  CacheDecoratorOptions,
  CacheKeyGenerator,
  CacheDecoratorStrategy
} from './cache.decorator';

// Constants for metadata keys
export {
  CACHE_KEY,
  CACHE_TTL_KEY,
  CACHE_TAGS_KEY,
  CACHE_NAMESPACE_KEY,
  CACHE_HEALTHCARE_KEY
} from './cache.decorator';

// Utility functions for cache key generation
export const CacheKeyUtils = {
  /**
   * Generate a cache key for user-specific data
   */
  userKey: (userId: string, suffix: string) => `user:${userId}:${suffix}`,
  
  /**
   * Generate a cache key for session data
   */
  sessionKey: (sessionId: string, suffix: string) => `session:${sessionId}:${suffix}`,
  
  /**
   * Generate a cache key for healthcare patient data
   */
  patientKey: (patientId: string, suffix: string) => `patient:${patientId}:${suffix}`,
  
  /**
   * Generate a cache key for appointment data
   */
  appointmentKey: (appointmentId: string, suffix?: string) => 
    suffix ? `appointment:${appointmentId}:${suffix}` : `appointment:${appointmentId}`,
  
  /**
   * Generate a cache key for search results
   */
  searchKey: (query: string, filters?: Record<string, any>) => {
    const filterStr = filters ? JSON.stringify(filters) : '';
    const hash = require('crypto').createHash('md5').update(query + filterStr).digest('hex');
    return `search:${hash}`;
  },
  
  /**
   * Generate a cache key for API responses
   */
  apiKey: (endpoint: string, params?: Record<string, any>) => {
    const paramStr = params ? JSON.stringify(params) : '';
    const hash = require('crypto').createHash('md5').update(endpoint + paramStr).digest('hex');
    return `api:${hash}`;
  },
  
  /**
   * Generate a cache key for file metadata
   */
  fileKey: (fileId: string, operation: string) => `file:${fileId}:${operation}`,
  
  /**
   * Generate a cache key for analytics data
   */
  analyticsKey: (metric: string, timeframe: string, filters?: Record<string, any>) => {
    const filterStr = filters ? JSON.stringify(filters) : '';
    const hash = require('crypto').createHash('md5').update(metric + timeframe + filterStr).digest('hex');
    return `analytics:${hash}`;
  }
};

// Common cache configurations
export const CacheConfigs = {
  /**
   * Fast cache for frequently accessed, small data (5 minutes)
   */
  FAST: {
    ttl: 300,
    serialize: true,
    compress: false,
    tags: ['fast-cache']
  } as const,
  
  /**
   * Standard cache for regular application data (1 hour)
   */
  STANDARD: {
    ttl: 3600,
    serialize: true,
    compress: false,
    tags: ['standard-cache']
  } as const,
  
  /**
   * Long-term cache for rarely changing data (6 hours)
   */
  LONG_TERM: {
    ttl: 21600,
    serialize: true,
    compress: true,
    tags: ['long-term-cache']
  } as const,
  
  /**
   * Session cache for user session data (2 hours)
   */
  SESSION: {
    ttl: 7200,
    serialize: true,
    compress: false,
    namespace: 'sessions',
    tags: ['session-data']
  } as const,
  
  /**
   * Healthcare cache with HIPAA compliance (30 minutes)
   */
  HEALTHCARE: {
    ttl: 1800,
    serialize: true,
    compress: true,
    healthcareData: true,
    hipaaCompliant: true,
    encryptionRequired: true,
    namespace: 'healthcare',
    tags: ['healthcare-data', 'phi']
  } as const,
  
  /**
   * Search results cache (15 minutes)
   */
  SEARCH: {
    ttl: 900,
    serialize: true,
    compress: true,
    namespace: 'search',
    tags: ['search-results']
  } as const,
  
  /**
   * API response cache (10 minutes)
   */
  API_RESPONSE: {
    ttl: 600,
    serialize: true,
    compress: true,
    namespace: 'api',
    tags: ['api-responses']
  } as const,
  
  /**
   * File metadata cache (1 hour)
   */
  FILE_METADATA: {
    ttl: 3600,
    serialize: true,
    compress: false,
    namespace: 'files',
    tags: ['file-metadata']
  } as const,
  
  /**
   * Analytics cache for dashboard data (5 minutes)
   */
  ANALYTICS: {
    ttl: 300,
    serialize: true,
    compress: true,
    namespace: 'analytics',
    tags: ['analytics-data']
  } as const
};

// Cache tag constants for easy invalidation
export const CacheTags = {
  // User-related tags
  USERS: 'users',
  USER_PROFILES: 'user-profiles',
  USER_PREFERENCES: 'user-preferences',
  USER_SESSIONS: 'user-sessions',
  
  // Healthcare-specific tags
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medical-records',
  PRESCRIPTIONS: 'prescriptions',
  HEALTHCARE_DATA: 'healthcare-data',
  PHI: 'phi', // Protected Health Information
  
  // Business logic tags
  SEARCH_RESULTS: 'search-results',
  API_RESPONSES: 'api-responses',
  FILE_METADATA: 'file-metadata',
  ANALYTICS_DATA: 'analytics-data',
  
  // System tags
  SYSTEM_CONFIG: 'system-config',
  FEATURE_FLAGS: 'feature-flags',
  LOOKUP_DATA: 'lookup-data',
  
  // Performance tags
  FAST_CACHE: 'fast-cache',
  STANDARD_CACHE: 'standard-cache',
  LONG_TERM_CACHE: 'long-term-cache'
} as const;

// Helper type for cache tag values
export type CacheTagValue = typeof CacheTags[keyof typeof CacheTags];

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  /**
   * Invalidate all user-related cache entries
   */
  invalidateUser: async (cacheManager: any, userId: string) => {
    await cacheManager.invalidateByTags([
      CacheTags.USERS,
      CacheTags.USER_PROFILES,
      CacheTags.USER_PREFERENCES,
      CacheTags.USER_SESSIONS
    ]);
    
    // Also invalidate specific user keys
    await cacheManager.delete(`user:${userId}:profile`);
    await cacheManager.delete(`user:${userId}:preferences`);
    await cacheManager.delete(`user:${userId}:permissions`);
  },
  
  /**
   * Invalidate all patient-related cache entries
   */
  invalidatePatient: async (cacheManager: any, patientId: string) => {
    await cacheManager.invalidateByTags([
      CacheTags.PATIENTS,
      CacheTags.MEDICAL_RECORDS,
      CacheTags.APPOINTMENTS,
      CacheTags.HEALTHCARE_DATA
    ]);
    
    // Also invalidate specific patient keys
    await cacheManager.delete(`patient:${patientId}:profile`);
    await cacheManager.delete(`patient:${patientId}:records`);
    await cacheManager.delete(`patient:${patientId}:appointments`);
  },
  
  /**
   * Invalidate search-related cache entries
   */
  invalidateSearch: async (cacheManager: any) => {
    await cacheManager.invalidateByTags([CacheTags.SEARCH_RESULTS]);
  },
  
  /**
   * Invalidate API response cache
   */
  invalidateApiResponses: async (cacheManager: any) => {
    await cacheManager.invalidateByTags([CacheTags.API_RESPONSES]);
  },
  
  /**
   * Invalidate analytics cache
   */
  invalidateAnalytics: async (cacheManager: any) => {
    await cacheManager.invalidateByTags([CacheTags.ANALYTICS_DATA]);
  }
};

/**
 * Performance monitoring utilities for cache
 */
export const CacheMonitoring = {
  /**
   * Log cache performance metrics
   */
  logPerformance: (operation: string, duration: number, cacheHit: boolean, keySize?: number) => {
    console.log(`Cache ${operation}: ${duration}ms, Hit: ${cacheHit}${keySize ? `, Size: ${keySize}B` : ''}`);
  },
  
  /**
   * Calculate cache efficiency metrics
   */
  calculateEfficiency: (stats: CacheStats) => ({
    hitRate: stats.hitRate,
    missRate: 100 - stats.hitRate,
    avgResponseTime: stats.avgResponseTime,
    memoryEfficiency: (stats.keyCount / (stats.memoryUsage / 1024)) // keys per KB
  })
};