/**
 * ChunkedUploadService - Handle large media file uploads for session recordings
 * Supports resumable uploads and parallel chunk processing for scalability
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { RecordingUpload } from './recording-upload.entity';
import { RecordingChunk } from './recording-chunk.entity';

interface ChunkUploadRequest {
  recordingId: string;
  chunkIndex: number;
  totalChunks: number;
  chunk: Buffer;
  metadata?: {
    sessionId: string;
    participantId: string;
    mimeType: string;
    originalName?: string;
  };
}

interface UploadProgress {
  recordingId: string;
  uploadedChunks: number;
  totalChunks: number;
  totalSize: number;
  uploadedSize: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'aborted';
  s3Location?: string;
  error?: string;
}

@Injectable()
export class ChunkedUploadService {
  private readonly logger = new Logger(ChunkedUploadService.name);

  private s3Client!: S3Client;

  constructor(
    @InjectRepository(RecordingUpload)
    private readonly recordingUploadRepository: Repository<RecordingUpload>,
    @InjectRepository(RecordingChunk)
    private readonly recordingChunkRepository: Repository<RecordingChunk>
  ) {
    // Initialize S3 client in constructor to handle errors gracefully
    try {
      this.s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
        forcePathStyle: true,
      });
    } catch (error) {
      this.logger.warn('S3 client initialization failed, some features may not work:', error instanceof Error ? error.message : String(error));
    }
  }


  /**
   * Initialize a new chunked upload session
   */
  async initializeUpload(metadata: {
    recordingId: string;
    sessionId: string;
    participantId: string;
    totalChunks: number;
    estimatedSize: number;
    mimeType: string;
    originalName?: string;
  }): Promise<{ uploadId: string; s3UploadId: string }> {
    try {
      // Generate S3 key
      const s3Key = this.generateS3Key(metadata.sessionId, metadata.participantId, metadata.recordingId);
      
      // Initialize multipart upload in S3
      const createMultipartCommand = new CreateMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET || 'recordings',
        Key: s3Key,
        ContentType: metadata.mimeType,
        Metadata: {
          sessionId: metadata.sessionId,
          participantId: metadata.participantId,
          recordingId: metadata.recordingId,
          originalName: metadata.originalName || '',
          uploadTimestamp: new Date().toISOString()
        }
      });

      const multipartResponse = await this.s3Client.send(createMultipartCommand);
      
      if (!multipartResponse.UploadId) {
        throw new Error('Failed to initialize S3 multipart upload');
      }

      // Create database record
      const recordingUpload = this.recordingUploadRepository.create({
        recordingId: metadata.recordingId,
        sessionId: metadata.sessionId,
        participantId: metadata.participantId,
        s3Key,
        s3UploadId: multipartResponse.UploadId,
        totalChunks: metadata.totalChunks,
        estimatedSize: metadata.estimatedSize,
        mimeType: metadata.mimeType,
        originalName: metadata.originalName,
        status: 'pending',
        uploadedChunks: 0,
        uploadedSize: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.recordingUploadRepository.save(recordingUpload);

      this.logger.log(`Initialized upload for recording ${metadata.recordingId} with S3 upload ID ${multipartResponse.UploadId}`);

      return {
        uploadId: recordingUpload.id,
        s3UploadId: multipartResponse.UploadId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize upload for recording ${metadata.recordingId}:`, errorMessage);
      throw new BadRequestException(`Failed to initialize upload: ${errorMessage}`);
    }
  }

  /**
   * Upload a single chunk with retry logic and progress tracking
   */
  async uploadChunk(request: ChunkUploadRequest): Promise<{ success: boolean; etag?: string; progress: UploadProgress }> {
    try {
      // Find or create upload record
      let uploadRecord = await this.recordingUploadRepository.findOne({
        where: { recordingId: request.recordingId }
      });

      if (!uploadRecord) {
        // Auto-initialize if not exists (for backwards compatibility)
        const initResult = await this.initializeUpload({
          recordingId: request.recordingId,
          sessionId: request.metadata?.sessionId || '',
          participantId: request.metadata?.participantId || '',
          totalChunks: request.totalChunks,
          estimatedSize: request.chunk.length * request.totalChunks,
          mimeType: request.metadata?.mimeType || 'video/webm',
          originalName: request.metadata?.originalName
        });

        uploadRecord = await this.recordingUploadRepository.findOne({
          where: { id: initResult.uploadId }
        });
      }

      if (!uploadRecord) {
        throw new Error('Upload record not found');
      }

      // Check if chunk already uploaded
      const existingChunk = await this.recordingChunkRepository.findOne({
        where: { 
          recordingId: request.recordingId,
          chunkIndex: request.chunkIndex 
        }
      });

      let etag: string;

      if (existingChunk && existingChunk.etag) {
        etag = existingChunk.etag;
        this.logger.debug(`Chunk ${request.chunkIndex} already uploaded for recording ${request.recordingId}`);
      } else {
        // Upload chunk to S3
        const uploadPartCommand = new UploadPartCommand({
          Bucket: process.env.S3_BUCKET || 'recordings',
          Key: uploadRecord.s3Key,
          PartNumber: request.chunkIndex + 1, // S3 part numbers start at 1
          UploadId: uploadRecord.s3UploadId,
          Body: request.chunk,
          ContentLength: request.chunk.length
        });

        const uploadResult = await this.s3Client.send(uploadPartCommand);
        etag = uploadResult.ETag || '';

        // Save chunk record
        const chunkRecord = this.recordingChunkRepository.create({
          recordingId: request.recordingId,
          chunkIndex: request.chunkIndex,
          size: request.chunk.length,
          etag,
          uploadedAt: new Date()
        });

        await this.recordingChunkRepository.save(chunkRecord);

        this.logger.debug(`Uploaded chunk ${request.chunkIndex}/${request.totalChunks - 1} for recording ${request.recordingId}`);
      }

      // Update upload progress
      const uploadedChunks = await this.recordingChunkRepository.count({
        where: { recordingId: request.recordingId }
      });

      const uploadedSize = await this.recordingChunkRepository
        .createQueryBuilder('chunk')
        .select('SUM(chunk.size)', 'total')
        .where('chunk.recordingId = :recordingId', { recordingId: request.recordingId })
        .getRawOne();

      uploadRecord.uploadedChunks = uploadedChunks;
      uploadRecord.uploadedSize = parseInt(uploadedSize?.total || '0');
      uploadRecord.status = uploadedChunks >= request.totalChunks ? 'completed' : 'uploading';
      uploadRecord.updatedAt = new Date();

      await this.recordingUploadRepository.save(uploadRecord);

      // Complete multipart upload if all chunks are uploaded
      if (uploadedChunks >= request.totalChunks) {
        await this.completeUpload(request.recordingId);
      }

      const progress: UploadProgress = {
        recordingId: request.recordingId,
        uploadedChunks,
        totalChunks: request.totalChunks,
        totalSize: uploadRecord.estimatedSize,
        uploadedSize: uploadRecord.uploadedSize,
        status: uploadRecord.status as any,
        s3Location: uploadRecord.status === 'completed' ? uploadRecord.s3Location : undefined
      };

      return { success: true, etag, progress };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload chunk ${request.chunkIndex} for recording ${request.recordingId}:`, errorMessage);
      
      // Update status to failed
      await this.recordingUploadRepository.update(
        { recordingId: request.recordingId },
        { status: 'failed', error: error instanceof Error ? error.message : String(error), updatedAt: new Date() }
      );

      const progress: UploadProgress = {
        recordingId: request.recordingId,
        uploadedChunks: 0,
        totalChunks: request.totalChunks,
        totalSize: 0,
        uploadedSize: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      };

      return { success: false, progress };
    }
  }

  /**
   * Complete multipart upload and finalize the recording file
   */
  async completeUpload(recordingId: string): Promise<{ s3Location: string; totalSize: number }> {
    try {
      const uploadRecord = await this.recordingUploadRepository.findOne({
        where: { recordingId }
      });

      if (!uploadRecord) {
        throw new Error('Upload record not found');
      }

      if (uploadRecord.status === 'completed' && uploadRecord.s3Location) {
        return {
          s3Location: uploadRecord.s3Location,
          totalSize: uploadRecord.uploadedSize
        };
      }

      // Get all chunks with ETags
      const chunks = await this.recordingChunkRepository.find({
        where: { recordingId },
        order: { chunkIndex: 'ASC' }
      });

      if (chunks.length !== uploadRecord.totalChunks) {
        throw new Error(`Missing chunks: expected ${uploadRecord.totalChunks}, got ${chunks.length}`);
      }

      // Complete multipart upload
      const parts = chunks.map(chunk => ({
        ETag: chunk.etag,
        PartNumber: chunk.chunkIndex + 1
      }));

      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET || 'recordings',
        Key: uploadRecord.s3Key,
        UploadId: uploadRecord.s3UploadId,
        MultipartUpload: { Parts: parts }
      });

      const completeResult = await this.s3Client.send(completeCommand);
      
      if (!completeResult.Location) {
        throw new Error('S3 upload completion failed - no location returned');
      }

      // Update upload record
      uploadRecord.status = 'completed';
      uploadRecord.s3Location = completeResult.Location;
      uploadRecord.completedAt = new Date();
      uploadRecord.updatedAt = new Date();

      await this.recordingUploadRepository.save(uploadRecord);

      this.logger.log(`Completed upload for recording ${recordingId} at ${completeResult.Location}`);

      return {
        s3Location: completeResult.Location,
        totalSize: uploadRecord.uploadedSize
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to complete upload for recording ${recordingId}:`, errorMessage);
      
      // Update status to failed
      await this.recordingUploadRepository.update(
        { recordingId },
        { status: 'failed', error: error instanceof Error ? error.message : String(error), updatedAt: new Date() }
      );

      throw new BadRequestException(`Failed to complete upload: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get upload progress for a recording
   */
  async getUploadProgress(recordingId: string): Promise<UploadProgress | null> {
    const uploadRecord = await this.recordingUploadRepository.findOne({
      where: { recordingId }
    });

    if (!uploadRecord) {
      return null;
    }

    return {
      recordingId,
      uploadedChunks: uploadRecord.uploadedChunks,
      totalChunks: uploadRecord.totalChunks,
      totalSize: uploadRecord.estimatedSize,
      uploadedSize: uploadRecord.uploadedSize,
      status: uploadRecord.status as any,
      s3Location: uploadRecord.s3Location,
      error: uploadRecord.error
    };
  }

  /**
   * Abort an incomplete upload and clean up resources
   */
  async abortUpload(recordingId: string): Promise<void> {
    try {
      const uploadRecord = await this.recordingUploadRepository.findOne({
        where: { recordingId }
      });

      if (!uploadRecord) {
        throw new Error('Upload record not found');
      }

      if (uploadRecord.status === 'completed') {
        throw new Error('Cannot abort completed upload');
      }

      // Abort S3 multipart upload
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET || 'recordings',
        Key: uploadRecord.s3Key,
        UploadId: uploadRecord.s3UploadId
      });

      await this.s3Client.send(abortCommand);

      // Clean up database records
      await this.recordingChunkRepository.delete({ recordingId });
      
      uploadRecord.status = 'aborted';
      uploadRecord.updatedAt = new Date();
      await this.recordingUploadRepository.save(uploadRecord);

      this.logger.log(`Aborted upload for recording ${recordingId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to abort upload for recording ${recordingId}:`, errorMessage);
      throw new BadRequestException(`Failed to abort upload: ${errorMessage}`);
    }
  }

  /**
   * Clean up old incomplete uploads (should be run periodically)
   */
  async cleanupStaleUploads(olderThanHours: number = 24): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    const staleUploads = await this.recordingUploadRepository.find({
      where: {
        status: 'uploading' as any,
        updatedAt: { $lt: cutoffDate } as any
      }
    });

    let cleanedCount = 0;

    for (const upload of staleUploads) {
      try {
        await this.abortUpload(upload.recordingId);
        cleanedCount++;
      } catch (error) {
        this.logger.warn(`Failed to cleanup stale upload ${upload.recordingId}:`, error instanceof Error ? error.message : String(error));
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} stale uploads`);
    }

    return cleanedCount;
  }

  /**
   * Get recording file URL for playback
   */
  async getRecordingUrl(recordingId: string): Promise<string | null> {
    const uploadRecord = await this.recordingUploadRepository.findOne({
      where: { recordingId, status: 'completed' }
    });

    return uploadRecord?.s3Location || null;
  }

  /**
   * Generate S3 key for organized storage
   */
  private generateS3Key(sessionId: string, participantId: string, recordingId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `recordings/${year}/${month}/${day}/${sessionId}/${participantId}/${recordingId}.webm`;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalUploads: number;
    completedUploads: number;
    failedUploads: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    const stats = await this.recordingUploadRepository
      .createQueryBuilder('upload')
      .select([
        'COUNT(*) as totalUploads',
        'SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completedUploads',
        'SUM(CASE WHEN status = \'failed\' THEN 1 ELSE 0 END) as failedUploads',
        'SUM(CASE WHEN status = \'completed\' THEN uploadedSize ELSE 0 END) as totalSize',
        'AVG(CASE WHEN status = \'completed\' THEN uploadedSize ELSE NULL END) as averageFileSize'
      ])
      .getRawOne();

    return {
      totalUploads: parseInt(stats.totalUploads) || 0,
      completedUploads: parseInt(stats.completedUploads) || 0,
      failedUploads: parseInt(stats.failedUploads) || 0,
      totalSize: parseInt(stats.totalSize) || 0,
      averageFileSize: parseInt(stats.averageFileSize) || 0
    };
  }
}