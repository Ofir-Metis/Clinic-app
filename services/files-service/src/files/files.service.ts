import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// File validation constants
const AUDIO_VIDEO_EXTENSIONS = ['wav', 'webm', 'ogg', 'mp3', 'mpeg', 'mp4', 'm4a'];
const GENERAL_FILE_EXTENSIONS = [
  ...AUDIO_VIDEO_EXTENSIONS,
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'doc', 'docx',
];
const MAX_AUDIO_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_GENERAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private client: S3Client | null = null;
  private readonly bucket = process.env.S3_BUCKET || 'uploads';

  constructor() {
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;

    if (!endpoint) {
      this.logger.warn('S3_ENDPOINT not configured - file upload features will be unavailable');
      return;
    }

    if (!accessKey || !secretKey) {
      this.logger.warn('S3 credentials not configured - file upload features will be unavailable');
      return;
    }

    try {
      this.client = new S3Client({
        endpoint,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });
      this.logger.log('S3 client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize S3 client:', error instanceof Error ? error.message : String(error));
    }
  }

  private ensureS3Available(): void {
    if (!this.client) {
      throw new InternalServerErrorException('S3 storage is not configured. Please check S3_ENDPOINT and credentials.');
    }
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('File key is required');
    }

    // Prevent path traversal attacks
    if (key.includes('..') || key.startsWith('/')) {
      throw new BadRequestException('Invalid file key: path traversal not allowed');
    }

    // Validate key length
    if (key.length > 1024) {
      throw new BadRequestException('File key exceeds maximum length of 1024 characters');
    }

    // Validate key characters (alphanumeric, dots, dashes, underscores, slashes)
    const validKeyPattern = /^[a-zA-Z0-9._\-\/]+$/;
    if (!validKeyPattern.test(key)) {
      throw new BadRequestException('File key contains invalid characters');
    }
  }

  private getFileExtension(key: string): string | null {
    const parts = key.split('.');
    if (parts.length < 2) return null;
    return parts[parts.length - 1].toLowerCase();
  }

  private validateFileExtension(key: string): void {
    const ext = this.getFileExtension(key);
    if (!ext || !GENERAL_FILE_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File extension '.${ext}' is not allowed. Allowed extensions: ${GENERAL_FILE_EXTENSIONS.join(', ')}`
      );
    }
  }

  private getMaxFileSize(key: string): number {
    const ext = this.getFileExtension(key);
    if (ext && AUDIO_VIDEO_EXTENSIONS.includes(ext)) {
      return MAX_AUDIO_VIDEO_SIZE;
    }
    return MAX_GENERAL_FILE_SIZE;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async uploadUrl(key: string): Promise<{ url: string; expiresIn: number; maxSizeBytes: number }> {
    this.ensureS3Available();
    this.validateKey(key);
    this.validateFileExtension(key);

    const maxSizeBytes = this.getMaxFileSize(key);

    try {
      this.logger.log(`Generating upload URL for key: ${key} (max size: ${this.formatBytes(maxSizeBytes)})`);

      // Generate presigned URL with size constraint metadata
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        // Note: S3 presigned URLs don't enforce size limits natively
        // Client-side must validate before upload, server-side validates after
        Metadata: {
          'max-size-bytes': maxSizeBytes.toString(),
        },
      });
      const expiresIn = 3600; // 1 hour
      const url = await getSignedUrl(this.client!, command, { expiresIn });

      this.logger.debug(`Upload URL generated for key: ${key}`);
      return { url, expiresIn, maxSizeBytes };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate upload URL for key ${key}:`, errorMessage);
      throw new InternalServerErrorException(`Failed to generate upload URL: ${errorMessage}`);
    }
  }

  async downloadUrl(key: string): Promise<{ url: string; expiresIn: number }> {
    this.ensureS3Available();
    this.validateKey(key);

    try {
      this.logger.log(`Generating download URL for key: ${key}`);

      // Check if file exists first
      await this.checkFileExists(key);

      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const expiresIn = 3600; // 1 hour
      const url = await getSignedUrl(this.client!, command, { expiresIn });

      this.logger.debug(`Download URL generated for key: ${key}`);
      return { url, expiresIn };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate download URL for key ${key}:`, errorMessage);
      throw new InternalServerErrorException(`Failed to generate download URL: ${errorMessage}`);
    }
  }

  async deleteFile(key: string): Promise<{ success: boolean; message: string }> {
    this.ensureS3Available();
    this.validateKey(key);

    try {
      this.logger.log(`Deleting file with key: ${key}`);
      const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
      await this.client!.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete file ${key}:`, errorMessage);
      throw new InternalServerErrorException(`Failed to delete file: ${errorMessage}`);
    }
  }

  async checkFileExists(key: string): Promise<{ exists: boolean; size?: number; lastModified?: Date }> {
    this.ensureS3Available();
    this.validateKey(key);

    try {
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.client!.send(command);

      return {
        exists: true,
        size: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return { exists: false };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check file existence for ${key}:`, errorMessage);
      throw new InternalServerErrorException(`Failed to check file: ${errorMessage}`);
    }
  }

  isS3Available(): boolean {
    return this.client !== null;
  }
}
