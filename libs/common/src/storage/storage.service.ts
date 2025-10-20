/**
 * StorageService - Unified interface for S3/MinIO file storage
 * Handles recording uploads, downloads, and management with production-ready features
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface StorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  buckets: {
    recordings: string;
    transcripts: string;
    summaries: string;
    thumbnails: string;
  };
  useSSL: boolean;
  pathStyle: boolean;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  encryption?: boolean;
  retention?: number; // days
  generateThumbnail?: boolean;
  compress?: boolean;
}

export interface UploadResult {
  key: string;
  etag: string;
  location: string;
  bucket: string;
  size: number;
  contentType: string;
  metadata?: Record<string, string>;
  uploadId: string;
  thumbnailKey?: string;
}

export interface DownloadOptions {
  responseContentType?: string;
  responseContentDisposition?: string;
  versionId?: string;
  range?: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds, default 3600 (1 hour)
  responseContentType?: string;
  responseContentDisposition?: string;
}

@Injectable()
class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3;
  private readonly config: StorageConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      endpoint: this.configService.get('S3_ENDPOINT', 'http://localhost:9000'),
      accessKeyId: this.configService.get('MINIO_ROOT_USER', 'minio'),
      secretAccessKey: this.configService.get('MINIO_ROOT_PASSWORD', 'minio123'),
      region: this.configService.get('S3_REGION', 'us-east-1'),
      buckets: {
        recordings: this.configService.get('RECORDINGS_BUCKET', 'clinic-recordings'),
        transcripts: this.configService.get('TRANSCRIPTS_BUCKET', 'clinic-transcripts'),
        summaries: this.configService.get('SUMMARIES_BUCKET', 'clinic-summaries'),
        thumbnails: this.configService.get('THUMBNAILS_BUCKET', 'clinic-thumbnails'),
      },
      useSSL: this.configService.get('S3_USE_SSL', 'false') === 'true',
      pathStyle: this.configService.get('S3_PATH_STYLE', 'true') === 'true', // MinIO requires path style
    };

    // Configure AWS SDK v2 Client
    this.s3 = new AWS.S3({
      endpoint: this.config.endpoint,
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      s3ForcePathStyle: this.config.pathStyle,
      sslEnabled: this.config.useSSL,
      signatureVersion: 'v4',
    });

    this.initializeBuckets();
  }

  /**
   * Initialize storage buckets if they don't exist
   */
  private async initializeBuckets(): Promise<void> {
    try {
      for (const [bucketType, bucketName] of Object.entries(this.config.buckets)) {
        await this.createBucketIfNotExists(bucketName);
        await this.configureBucketPolicy(bucketName, bucketType);
        this.logger.log(`✅ Bucket ${bucketName} (${bucketType}) ready`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize storage buckets:', error);
    }
  }

  /**
   * Create bucket if it doesn't exist
   */
  private async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: bucketName }).promise();
    } catch (error) {
      if (error.statusCode === 404 || error.code === 'NoSuchBucket') {
        this.logger.log(`Creating bucket: ${bucketName}`);
        await this.s3.createBucket({ Bucket: bucketName }).promise();
      } else {
        throw error;
      }
    }
  }

  /**
   * Configure bucket policies for security and access control
   */
  private async configureBucketPolicy(bucketName: string, bucketType: string): Promise<void> {
    try {
      // Configure CORS for web uploads
      const corsConfiguration = {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
              this.configService.get('FRONTEND_ORIGIN', 'http://localhost:5173'),
              this.configService.get('API_ORIGIN', 'http://localhost:4000'),
            ],
            ExposeHeaders: ['ETag', 'x-amz-request-id'],
            MaxAgeSeconds: 3000,
          },
        ],
      };

      await this.s3.putBucketCors({
        Bucket: bucketName,
        CORSConfiguration: corsConfiguration,
      }).promise();

      // Configure lifecycle policy for recordings (optional retention)
      if (bucketType === 'recordings') {
        const retentionDays = parseInt(this.configService.get('RECORDING_RETENTION_DAYS', '365'));
        const lifecycleConfiguration = {
          Rules: [
            {
              ID: 'RecordingRetentionRule',
              Status: 'Enabled' as const,
              Filter: { Prefix: 'recordings/' },
              Expiration: { Days: retentionDays },
              Transitions: [
                {
                  Days: 30,
                  StorageClass: 'STANDARD_IA' as const, // Move to Infrequent Access after 30 days
                },
                {
                  Days: 90,
                  StorageClass: 'GLACIER' as const, // Move to Glacier after 90 days
                },
              ],
            },
          ],
        };

        try {
          await this.s3.putBucketLifecycleConfiguration({
            Bucket: bucketName,
            LifecycleConfiguration: lifecycleConfiguration,
          }).promise();
        } catch (error) {
          // MinIO might not support lifecycle policies
          this.logger.warn(`Lifecycle policy not supported for ${bucketName}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to configure bucket policy for ${bucketName}:`, error.message);
    }
  }

  /**
   * Upload a recording file
   */
  async uploadRecording(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    appointmentId: string,
    sessionId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const uploadId = uuidv4();
    const key = `recordings/${appointmentId}/${sessionId}/${uploadId}_${filename}`;
    
    return this.uploadFile(
      this.config.buckets.recordings,
      key,
      file,
      {
        ...options,
        metadata: {
          appointmentId,
          sessionId,
          uploadId,
          originalFilename: filename,
          uploadDate: new Date().toISOString(),
          ...options.metadata,
        },
        tags: {
          type: 'recording',
          appointmentId,
          sessionId,
          ...options.tags,
        },
      }
    );
  }

  /**
   * Upload a transcript file
   */
  async uploadTranscript(
    content: string,
    recordingId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = `transcripts/${recordingId}/transcript.json`;
    const buffer = Buffer.from(JSON.stringify({
      recordingId,
      content,
      generatedAt: new Date().toISOString(),
      format: 'json',
    }));

    return this.uploadFile(
      this.config.buckets.transcripts,
      key,
      buffer,
      {
        ...options,
        contentType: 'application/json',
        metadata: {
          recordingId,
          type: 'transcript',
          ...options.metadata,
        },
      }
    );
  }

  /**
   * Upload a session summary
   */
  async uploadSummary(
    summary: any,
    recordingId: string,
    appointmentId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = `summaries/${appointmentId}/${recordingId}/summary.json`;
    const buffer = Buffer.from(JSON.stringify({
      ...summary,
      recordingId,
      appointmentId,
      generatedAt: new Date().toISOString(),
    }));

    return this.uploadFile(
      this.config.buckets.summaries,
      key,
      buffer,
      {
        ...options,
        contentType: 'application/json',
        metadata: {
          recordingId,
          appointmentId,
          type: 'summary',
          ...options.metadata,
        },
      }
    );
  }

  /**
   * Generic file upload method
   */
  private async uploadFile(
    bucket: string,
    key: string,
    file: Buffer | NodeJS.ReadableStream,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {},
        ServerSideEncryption: options.encryption ? 'AES256' : undefined,
      };

      // Add tags if provided
      if (options.tags && Object.keys(options.tags).length > 0) {
        const tagSet = Object.entries(options.tags)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        uploadParams.Tagging = tagSet;
      }

      const result = await this.s3.upload(uploadParams).promise();

      this.logger.log(`✅ File uploaded: ${key} to ${bucket}`);

      return {
        key: result.Key,
        etag: result.ETag,
        location: result.Location,
        bucket: result.Bucket,
        size: Buffer.isBuffer(file) ? file.length : 0,
        contentType: uploadParams.ContentType,
        metadata: options.metadata,
        uploadId: options.metadata?.uploadId || uuidv4(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Download a file
   */
  async downloadFile(
    bucket: string,
    key: string,
    options: DownloadOptions = {}
  ): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        VersionId: options.versionId,
        Range: options.range,
      };

      const result = await this.s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      this.logger.error(`Failed to download file ${key}:`, error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for secure file access
   */
  async getSignedUrl(
    operation: 'getObject' | 'putObject',
    bucket: string,
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: options.expiresIn || 3600, // 1 hour default
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
      };

      return this.s3.getSignedUrl(operation, params);
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Get signed URL for recording download
   */
  async getRecordingDownloadUrl(recordingKey: string, expiresIn: number = 3600): Promise<string> {
    return this.getSignedUrl('getObject', this.config.buckets.recordings, recordingKey, {
      expiresIn,
      responseContentDisposition: 'attachment',
    });
  }

  /**
   * Get signed URL for recording playback (inline)
   */
  async getRecordingPlaybackUrl(recordingKey: string, expiresIn: number = 3600): Promise<string> {
    return this.getSignedUrl('getObject', this.config.buckets.recordings, recordingKey, {
      expiresIn,
      responseContentDisposition: 'inline',
    });
  }

  /**
   * Get signed URL for file upload
   */
  async getUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expiresIn,
        ContentType: contentType,
      };

      return this.s3.getSignedUrl('putObject', params);
    } catch (error) {
      this.logger.error(`Failed to generate upload URL for ${key}:`, error);
      throw new Error(`Upload URL generation failed: ${error.message}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      await this.s3.deleteObject({ Bucket: bucket, Key: key }).promise();
      this.logger.log(`🗑️ File deleted: ${key} from ${bucket}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List files in a bucket with pagination
   */
  async listFiles(
    bucket: string,
    prefix: string = '',
    maxKeys: number = 1000,
    continuationToken?: string
  ): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      etag: string;
    }>;
    isTruncated: boolean;
    nextContinuationToken?: string;
  }> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      };

      const result = await this.s3.listObjectsV2(params).promise();

      return {
        files: (result.Contents || []).map(obj => ({
          key: obj.Key!,
          size: obj.Size!,
          lastModified: obj.LastModified!,
          etag: obj.ETag!,
        })),
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
      };
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucket}:`, error);
      throw new Error(`List files failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    etag: string;
    metadata: Record<string, string>;
  }> {
    try {
      const result = await this.s3.headObject({ Bucket: bucket, Key: key }).promise();

      return {
        size: result.ContentLength!,
        lastModified: result.LastModified!,
        contentType: result.ContentType!,
        etag: result.ETag!,
        metadata: result.Metadata || {},
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}:`, error);
      throw new Error(`Get metadata failed: ${error.message}`);
    }
  }

  /**
   * Copy a file within storage
   */
  async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    try {
      await this.s3.copyObject({
        Bucket: destBucket,
        Key: destKey,
        CopySource: `${sourceBucket}/${sourceKey}`,
      }).promise();

      this.logger.log(`📋 File copied: ${sourceKey} -> ${destKey}`);
    } catch (error) {
      this.logger.error(`Failed to copy file from ${sourceKey} to ${destKey}:`, error);
      throw new Error(`Copy failed: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    recordings: { count: number; totalSize: number };
    transcripts: { count: number; totalSize: number };
    summaries: { count: number; totalSize: number };
  }> {
    const stats = {
      recordings: { count: 0, totalSize: 0 },
      transcripts: { count: 0, totalSize: 0 },
      summaries: { count: 0, totalSize: 0 },
    };

    try {
      for (const [type, bucket] of Object.entries(this.config.buckets)) {
        if (stats[type]) {
          const result = await this.listFiles(bucket);
          stats[type].count = result.files.length;
          stats[type].totalSize = result.files.reduce((sum, file) => sum + file.size, 0);
        }
      }
    } catch (error) {
      this.logger.error('Failed to get storage statistics:', error);
    }

    return stats;
  }

  /**
   * Health check for storage service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test connection by listing buckets
      await this.s3.listBuckets().promise();
      
      return {
        status: 'healthy',
        details: {
          endpoint: this.config.endpoint,
          buckets: this.config.buckets,
          region: this.config.region,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          endpoint: this.config.endpoint,
        },
      };
    }
  }
}

export { StorageService };