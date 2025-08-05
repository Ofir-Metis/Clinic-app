import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { StructuredLoggerService } from '@clinic/common';
import * as mimeTypes from 'mime-types';

export interface UploadOptions {
  bucket?: string;
  key: string;
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface AssetInfo {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private defaultBucket: string;

  constructor(private readonly logger: StructuredLoggerService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.S3_ENDPOINT, // For MinIO compatibility
      forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
    });

    this.defaultBucket = process.env.CDN_S3_BUCKET || 'clinic-cdn-assets';
  }

  /**
   * Upload asset to S3
   */
  async uploadAsset(buffer: Buffer, options: UploadOptions): Promise<AssetInfo> {
    const bucket = options.bucket || this.defaultBucket;
    const contentType = options.contentType || mimeTypes.lookup(options.key) || 'application/octet-stream';
    
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: options.cacheControl || this.getDefaultCacheControl(options.key),
        Metadata: options.metadata || {},
      });

      const response = await this.s3Client.send(command);
      
      this.logger.info('Asset uploaded to S3', {
        service: 'cdn-service',
        component: 's3',
        bucket,
        key: options.key,
        size: buffer.length,
        contentType,
      });

      return {
        key: options.key,
        size: buffer.length,
        contentType,
        lastModified: new Date(),
        etag: response.ETag || '',
        metadata: options.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to upload asset to S3', {
        service: 'cdn-service',
        component: 's3',
        bucket,
        key: options.key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get asset from S3
   */
  async getAsset(key: string, bucket?: string): Promise<{ buffer: Buffer; info: AssetInfo }> {
    const bucketName = bucket || this.defaultBucket;
    
    try {
      // Get object metadata first
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const headResponse = await this.s3Client.send(headCommand);

      // Get object data
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(getCommand);

      const buffer = await this.streamToBuffer(response.Body as any);
      
      const info: AssetInfo = {
        key,
        size: headResponse.ContentLength || buffer.length,
        contentType: headResponse.ContentType || 'application/octet-stream',
        lastModified: headResponse.LastModified || new Date(),
        etag: headResponse.ETag || '',
        metadata: headResponse.Metadata,
      };

      return { buffer, info };
    } catch (error) {
      this.logger.error('Failed to get asset from S3', {
        service: 'cdn-service',
        component: 's3',
        bucket: bucketName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete asset from S3
   */
  async deleteAsset(key: string, bucket?: string): Promise<void> {
    const bucketName = bucket || this.defaultBucket;
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      
      this.logger.info('Asset deleted from S3', {
        service: 'cdn-service',
        component: 's3',
        bucket: bucketName,
        key,
      });
    } catch (error) {
      this.logger.error('Failed to delete asset from S3', {
        service: 'cdn-service',
        component: 's3',
        bucket: bucketName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if asset exists in S3
   */
  async assetExists(key: string, bucket?: string): Promise<boolean> {
    const bucketName = bucket || this.defaultBucket;
    
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get asset metadata
   */
  async getAssetInfo(key: string, bucket?: string): Promise<AssetInfo | null> {
    const bucketName = bucket || this.defaultBucket;
    
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        metadata: response.Metadata,
      };
    } catch (error) {
      if (error.name === 'NotFound') {
        return null;
      }
      
      this.logger.error('Failed to get asset info from S3', {
        service: 'cdn-service',
        component: 's3',
        bucket: bucketName,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate pre-signed URL for direct uploads
   */
  async generateUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    // Implementation would depend on your specific needs
    // This is a placeholder for the actual implementation
    return `https://${this.defaultBucket}.s3.amazonaws.com/${key}?upload=true`;
  }

  /**
   * Get default cache control headers based on file type
   */
  private getDefaultCacheControl(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'public, max-age=31536000, immutable'; // 1 year for images
      
      case 'css':
      case 'js':
        return 'public, max-age=31536000, immutable'; // 1 year for CSS/JS
      
      case 'pdf':
      case 'doc':
      case 'docx':
        return 'public, max-age=86400'; // 1 day for documents
      
      case 'mp4':
      case 'webm':
      case 'ogg':
        return 'public, max-age=604800'; // 1 week for videos
      
      case 'mp3':
      case 'wav':
      case 'm4a':
        return 'public, max-age=604800'; // 1 week for audio
      
      default:
        return 'public, max-age=3600'; // 1 hour for other files
    }
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}