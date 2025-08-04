/**
 * Advanced Encryption Module
 * 
 * Comprehensive encryption solution for healthcare applications with:
 * - Advanced data encryption at rest with key rotation
 * - TLS/SSL security for data in transit
 * - Database field-level encryption with decorators
 * - Automatic encryption/decryption interceptors
 * - HIPAA-compliant encryption standards
 */

// Core services
export * from './advanced-encryption.service';
export * from './tls-security.service';

// Database encryption
export * from './database-encryption.decorator';
export * from './encryption.interceptor';

// Module exports
export * from './encryption.module';

// Type definitions
export type {
  EncryptionConfig,
  EncryptedData,
  KeyManagement,
  EncryptionMetrics
} from './advanced-encryption.service';

export type {
  TLSConfig,
  CertificateInfo,
  SecurityHeaders
} from './tls-security.service';

export type {
  EncryptionFieldOptions,
  EncryptedField
} from './database-encryption.decorator';

export type {
  EncryptionModuleOptions
} from './encryption.module';

// Utility functions
export {
  EncryptionMetadata,
  EncryptionUtils,
  EncryptedEntity
} from './database-encryption.decorator';

// Constants
export const EncryptionConstants = {
  // Algorithms
  ALGORITHMS: {
    AES_256_GCM: 'aes-256-gcm',
    AES_256_CBC: 'aes-256-cbc',
    CHACHA20_POLY1305: 'chacha20-poly1305'
  } as const,
  
  // TLS Versions
  TLS_VERSIONS: {
    TLS_1_2: 'TLSv1.2',
    TLS_1_3: 'TLSv1.3'
  } as const,
  
  // Key rotation intervals (days)
  KEY_ROTATION: {
    HEALTHCARE: 30,
    STANDARD: 90,
    HIGH_SECURITY: 7
  } as const,
  
  // Security headers
  SECURITY_HEADERS: {
    HSTS: 'Strict-Transport-Security',
    CSP: 'Content-Security-Policy',
    CONTENT_TYPE: 'X-Content-Type-Options',
    FRAME_OPTIONS: 'X-Frame-Options',
    XSS_PROTECTION: 'X-XSS-Protection',
    REFERRER_POLICY: 'Referrer-Policy',
    PERMISSIONS_POLICY: 'Permissions-Policy',
    EXPECT_CT: 'Expect-CT'
  } as const,
  
  // Healthcare compliance
  HEALTHCARE: {
    HSTS_MAX_AGE: 63072000, // 2 years
    KEY_DERIVATION_ITERATIONS: 100000,
    SALT_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16
  } as const
};

// Default configurations
export const DefaultEncryptionConfig = {
  // Standard encryption settings
  standard: {
    algorithm: EncryptionConstants.ALGORITHMS.AES_256_GCM,
    keyRotationDays: EncryptionConstants.KEY_ROTATION.STANDARD,
    compressionEnabled: true,
    tlsMinVersion: EncryptionConstants.TLS_VERSIONS.TLS_1_3,
    hstsEnabled: true,
    hstsMaxAge: 31536000, // 1 year
    ocspStapling: true,
    perfectForwardSecrecy: true
  },
  
  // Healthcare-specific settings
  healthcare: {
    algorithm: EncryptionConstants.ALGORITHMS.AES_256_GCM,
    keyRotationDays: EncryptionConstants.KEY_ROTATION.HEALTHCARE,
    compressionEnabled: true,
    tlsMinVersion: EncryptionConstants.TLS_VERSIONS.TLS_1_3,
    tlsMaxVersion: EncryptionConstants.TLS_VERSIONS.TLS_1_3,
    hstsEnabled: true,
    hstsMaxAge: EncryptionConstants.HEALTHCARE.HSTS_MAX_AGE,
    ocspStapling: true,
    perfectForwardSecrecy: true,
    keyDerivationIterations: EncryptionConstants.HEALTHCARE.KEY_DERIVATION_ITERATIONS
  },
  
  // High security settings
  highSecurity: {
    algorithm: EncryptionConstants.ALGORITHMS.CHACHA20_POLY1305,
    keyRotationDays: EncryptionConstants.KEY_ROTATION.HIGH_SECURITY,
    compressionEnabled: false, // Disable compression for maximum security
    tlsMinVersion: EncryptionConstants.TLS_VERSIONS.TLS_1_3,
    tlsMaxVersion: EncryptionConstants.TLS_VERSIONS.TLS_1_3,
    hstsEnabled: true,
    hstsMaxAge: EncryptionConstants.HEALTHCARE.HSTS_MAX_AGE,
    ocspStapling: true,
    perfectForwardSecrecy: true,
    keyDerivationIterations: 200000 // Double the iterations
  }
} as const;

// Error classes
export class EncryptionError extends Error {
  constructor(message: string, public readonly code: string = 'ENCRYPTION_ERROR') {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string, public readonly code: string = 'DECRYPTION_ERROR') {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class KeyRotationError extends Error {
  constructor(message: string, public readonly code: string = 'KEY_ROTATION_ERROR') {
    super(message);
    this.name = 'KeyRotationError';
  }
}

export class TLSConfigurationError extends Error {
  constructor(message: string, public readonly code: string = 'TLS_CONFIG_ERROR') {
    super(message);
    this.name = 'TLSConfigurationError';
  }
}

export class CertificateError extends Error {
  constructor(message: string, public readonly code: string = 'CERTIFICATE_ERROR') {
    super(message);
    this.name = 'CertificateError';
  }
}

// Validation helpers
export const EncryptionValidation = {
  /**
   * Validate encryption algorithm
   */
  isValidAlgorithm: (algorithm: string): boolean => {
    return Object.values(EncryptionConstants.ALGORITHMS).includes(algorithm as any);
  },
  
  /**
   * Validate TLS version
   */
  isValidTLSVersion: (version: string): boolean => {
    return Object.values(EncryptionConstants.TLS_VERSIONS).includes(version as any);
  },
  
  /**
   * Validate key rotation period
   */
  isValidKeyRotationPeriod: (days: number): boolean => {
    return days >= 1 && days <= 365;
  },
  
  /**
   * Validate HSTS max age
   */
  isValidHSTSMaxAge: (maxAge: number): boolean => {
    return maxAge >= 300 && maxAge <= 63072000; // 5 minutes to 2 years
  },
  
  /**
   * Check if encryption is required for data type
   */
  requiresEncryption: (dataType: string): boolean => {
    const encryptionRequiredTypes = [
      'phi', 'pii', 'medical_record', 'patient_data',
      'financial_info', 'ssn', 'credit_card', 'insurance_id'
    ];
    return encryptionRequiredTypes.includes(dataType.toLowerCase());
  }
};

// Helper functions
export const EncryptionHelpers = {
  /**
   * Generate secure random string
   */
  generateSecureRandom: (length: number = 32): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  },
  
  /**
   * Create encryption context
   */
  createContext: (userId?: string, additionalData?: Record<string, any>) => ({
    userId,
    timestamp: new Date().toISOString(),
    service: 'encryption-service',
    ...additionalData
  }),
  
  /**
   * Validate encrypted data format
   */
  isValidEncryptedData: (data: string): boolean => {
    try {
      const parsed = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
      return !!(parsed.data && parsed.iv && parsed.keyVersion && parsed.algorithm);
    } catch {
      return false;
    }
  },
  
  /**
   * Extract encryption metadata
   */
  extractEncryptionMetadata: (encryptedData: string) => {
    try {
      const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      return {
        keyVersion: parsed.keyVersion,
        algorithm: parsed.algorithm,
        timestamp: parsed.timestamp,
        metadata: parsed.metadata
      };
    } catch {
      return null;
    }
  }
};