/**
 * Enhanced Storage Configuration with Production-Ready Security
 * Supports S3, MinIO, and other S3-compatible services with encryption
 */

export interface StorageConfig {
  // Provider configuration
  provider: 'minio' | 's3' | 'gcs' | 'azure';
  endpoint?: string;
  region: string;
  
  // Authentication
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string; // For temporary credentials
  
  // Bucket configuration
  bucket: string;
  defaultACL?: string;
  
  // Encryption settings
  encryption: {
    enabled: boolean;
    type: 'AES256' | 'aws:kms' | 'SSE-C';
    kmsKeyId?: string; // For KMS encryption
    customerKey?: string; // For SSE-C encryption
    customerKeyMD5?: string; // For SSE-C encryption
  };
  
  // Security settings
  security: {
    forceSSL: boolean;
    signedUrlExpiry: number; // in seconds
    corsEnabled: boolean;
    allowedOrigins: string[];
    preventPublicAccess: boolean;
  };
  
  // Performance and reliability
  performance: {
    multipartThreshold: number; // bytes
    multipartPartSize: number; // bytes
    maxRetries: number;
    timeout: number; // milliseconds
    connectionPoolSize: number;
  };
  
  // File management
  fileManagement: {
    maxFileSize: number; // bytes
    allowedMimeTypes: string[];
    quarantineEnabled: boolean;
    virusScanEnabled: boolean;
    compressionEnabled: boolean;
    thumbnailGeneration: boolean;
  };
  
  // Lifecycle and retention
  lifecycle: {
    enabled: boolean;
    transitionToIA: number; // days
    transitionToGlacier: number; // days
    deleteAfter: number; // days
    versioningEnabled: boolean;
    maxVersions: number;
  };
  
  // Monitoring and logging
  monitoring: {
    metricsEnabled: boolean;
    loggingEnabled: boolean;
    auditTrailEnabled: boolean;
    performanceTrackingEnabled: boolean;
  };
}

export const createStorageConfig = (env: NodeJS.ProcessEnv): StorageConfig => {
  const isProduction = env.NODE_ENV === 'production';
  
  return {
    provider: (env.STORAGE_PROVIDER as any) || 'minio',
    endpoint: env.S3_ENDPOINT || 'http://localhost:9000',
    region: env.AWS_REGION || env.S3_REGION || 'us-east-1',
    
    // Authentication
    accessKeyId: env.AWS_ACCESS_KEY_ID || env.MINIO_ROOT_USER || 'minio',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || env.MINIO_ROOT_PASSWORD || 'minio123',
    sessionToken: env.AWS_SESSION_TOKEN,
    
    // Bucket configuration
    bucket: env.S3_BUCKET_NAME || 'clinic-recordings',
    defaultACL: env.S3_DEFAULT_ACL || 'private',
    
    // Encryption settings
    encryption: {
      enabled: env.STORAGE_ENCRYPTION_ENABLED !== 'false',
      type: (env.STORAGE_ENCRYPTION_TYPE as any) || (isProduction ? 'aws:kms' : 'AES256'),
      kmsKeyId: env.AWS_KMS_KEY_ID,
      customerKey: env.STORAGE_CUSTOMER_KEY,
      customerKeyMD5: env.STORAGE_CUSTOMER_KEY_MD5,
    },
    
    // Security settings
    security: {
      forceSSL: isProduction || env.STORAGE_FORCE_SSL === 'true',
      signedUrlExpiry: parseInt(env.STORAGE_SIGNED_URL_EXPIRY || '3600'), // 1 hour
      corsEnabled: env.STORAGE_CORS_ENABLED !== 'false',
      allowedOrigins: env.STORAGE_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      preventPublicAccess: env.STORAGE_PREVENT_PUBLIC_ACCESS !== 'false',
    },
    
    // Performance and reliability
    performance: {
      multipartThreshold: parseInt(env.STORAGE_MULTIPART_THRESHOLD || '104857600'), // 100MB
      multipartPartSize: parseInt(env.STORAGE_MULTIPART_PART_SIZE || '10485760'), // 10MB
      maxRetries: parseInt(env.STORAGE_MAX_RETRIES || '3'),
      timeout: parseInt(env.STORAGE_TIMEOUT || '30000'), // 30 seconds
      connectionPoolSize: parseInt(env.STORAGE_CONNECTION_POOL_SIZE || '10'),
    },
    
    // File management
    fileManagement: {
      maxFileSize: parseInt(env.STORAGE_MAX_FILE_SIZE || '536870912'), // 512MB
      allowedMimeTypes: env.STORAGE_ALLOWED_MIME_TYPES?.split(',') || [
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'audio/aac',
        'audio/ogg',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo', // .avi
      ],
      quarantineEnabled: env.STORAGE_QUARANTINE_ENABLED === 'true',
      virusScanEnabled: env.STORAGE_VIRUS_SCAN_ENABLED === 'true',
      compressionEnabled: env.STORAGE_COMPRESSION_ENABLED === 'true',
      thumbnailGeneration: env.STORAGE_THUMBNAIL_GENERATION === 'true',
    },
    
    // Lifecycle and retention
    lifecycle: {
      enabled: env.STORAGE_LIFECYCLE_ENABLED === 'true',
      transitionToIA: parseInt(env.STORAGE_TRANSITION_TO_IA || '30'), // 30 days
      transitionToGlacier: parseInt(env.STORAGE_TRANSITION_TO_GLACIER || '90'), // 90 days
      deleteAfter: parseInt(env.STORAGE_DELETE_AFTER || '2555'), // 7 years (HIPAA requirement)
      versioningEnabled: env.STORAGE_VERSIONING_ENABLED === 'true',
      maxVersions: parseInt(env.STORAGE_MAX_VERSIONS || '5'),
    },
    
    // Monitoring and logging
    monitoring: {
      metricsEnabled: env.STORAGE_METRICS_ENABLED !== 'false',
      loggingEnabled: env.STORAGE_LOGGING_ENABLED !== 'false',
      auditTrailEnabled: env.STORAGE_AUDIT_TRAIL_ENABLED !== 'false',
      performanceTrackingEnabled: env.STORAGE_PERFORMANCE_TRACKING_ENABLED !== 'false',
    },
  };
};

// Validation function
export const validateStorageConfig = (config: StorageConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!config.accessKeyId) {
    errors.push('Storage access key ID is required');
  }
  
  if (!config.secretAccessKey) {
    errors.push('Storage secret access key is required');
  }
  
  if (!config.bucket) {
    errors.push('Storage bucket name is required');
  }
  
  if (!config.region) {
    errors.push('Storage region is required');
  }
  
  // Encryption validation
  if (config.encryption.enabled) {
    if (config.encryption.type === 'aws:kms' && !config.encryption.kmsKeyId) {
      errors.push('KMS key ID is required when using KMS encryption');
    }
    
    if (config.encryption.type === 'SSE-C') {
      if (!config.encryption.customerKey) {
        errors.push('Customer key is required for SSE-C encryption');
      }
      if (!config.encryption.customerKeyMD5) {
        errors.push('Customer key MD5 is required for SSE-C encryption');
      }
    }
  }
  
  // Security validation
  if (config.security.signedUrlExpiry < 60 || config.security.signedUrlExpiry > 604800) {
    errors.push('Signed URL expiry must be between 60 seconds and 7 days');
  }
  
  // Performance validation
  if (config.performance.multipartThreshold < 5242880) { // 5MB minimum
    errors.push('Multipart threshold must be at least 5MB');
  }
  
  if (config.performance.multipartPartSize < 5242880) { // 5MB minimum
    errors.push('Multipart part size must be at least 5MB');
  }
  
  // File management validation
  if (config.fileManagement.maxFileSize > 5368709120) { // 5GB maximum
    errors.push('Maximum file size cannot exceed 5GB');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Default configurations for different environments
export const developmentStorageConfig: Partial<StorageConfig> = {
  provider: 'minio',
  endpoint: 'http://localhost:9000',
  encryption: {
    enabled: false,
    type: 'AES256',
  },
  security: {
    forceSSL: false,
    signedUrlExpiry: 3600, // 1 hour
    corsEnabled: true,
    allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
    preventPublicAccess: false,
  },
  monitoring: {
    metricsEnabled: true,
    loggingEnabled: true,
    auditTrailEnabled: false,
    performanceTrackingEnabled: false,
  },
};

export const productionStorageConfig: Partial<StorageConfig> = {
  provider: 's3',
  encryption: {
    enabled: true,
    type: 'aws:kms',
  },
  security: {
    forceSSL: true,
    signedUrlExpiry: 1800, // 30 minutes for production
    corsEnabled: true,
    allowedOrigins: ['https://yourdomain.com'],
    preventPublicAccess: true,
  },
  lifecycle: {
    enabled: true,
    transitionToIA: 30,
    transitionToGlacier: 90,
    deleteAfter: 2555, // 7 years
    versioningEnabled: true,
    maxVersions: 10,
  },
  monitoring: {
    metricsEnabled: true,
    loggingEnabled: true,
    auditTrailEnabled: true,
    performanceTrackingEnabled: true,
  },
};