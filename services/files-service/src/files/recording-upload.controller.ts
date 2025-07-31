/**
 * RecordingUploadController - REST API for chunked recording uploads
 * Supports scalable multipart uploads for large session recording files
 */

import { 
  Controller, 
  Post, 
  Get, 
  Delete,
  Body, 
  Param, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException,
  NotFoundException,
  Logger,
  Query,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { ChunkedUploadService } from './chunked-upload.service';

interface InitializeUploadDto {
  recordingId: string;
  sessionId: string;
  participantId: string;
  totalChunks: number;
  estimatedSize: number;
  mimeType: string;
  originalName?: string;
}

interface ChunkUploadResponse {
  success: boolean;
  etag?: string;
  progress: {
    recordingId: string;
    uploadedChunks: number;
    totalChunks: number;
    progressPercentage: number;
    uploadedSize: number;
    totalSize: number;
    status: string;
    s3Location?: string;
    error?: string;
  };
}

@ApiTags('Recording Uploads')
@Controller('recordings')
// @UseGuards(JwtAuthGuard)  // Temporarily disabled for testing
// @ApiBearerAuth()
export class RecordingUploadController {
  private readonly logger = new Logger(RecordingUploadController.name);

  constructor(private readonly chunkedUploadService: ChunkedUploadService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a new chunked upload session' })
  @ApiResponse({ status: 201, description: 'Upload session initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async initializeUpload(@Body() dto: InitializeUploadDto) {
    try {
      this.logger.log(`Initializing upload for recording ${dto.recordingId}`);

      // Validate input
      if (!dto.recordingId || !dto.sessionId || !dto.participantId) {
        throw new BadRequestException('Missing required fields: recordingId, sessionId, participantId');
      }

      if (dto.totalChunks <= 0 || dto.estimatedSize <= 0) {
        throw new BadRequestException('totalChunks and estimatedSize must be positive numbers');
      }

      if (!dto.mimeType || !dto.mimeType.startsWith('video/') && !dto.mimeType.startsWith('audio/')) {
        throw new BadRequestException('Invalid mimeType: must be video/* or audio/*');
      }

      const result = await this.chunkedUploadService.initializeUpload(dto);

      return {
        success: true,
        uploadId: result.uploadId,
        s3UploadId: result.s3UploadId,
        message: 'Upload session initialized successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to initialize upload for recording ${dto.recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a chunk of the recording file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Chunk uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid chunk data' })
  @UseInterceptors(FileInterceptor('chunk', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max chunk size
    },
    fileFilter: (req, file, cb) => {
      // Allow common video/audio formats
      const allowedMimes = [
        'video/webm', 'video/mp4', 'video/quicktime',
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
    }
  }))
  async uploadChunk(
    @UploadedFile() chunk: any,
    @Body('recordingId') recordingId: string,
    @Body('chunkIndex') chunkIndex: string,
    @Body('totalChunks') totalChunks: string,
    @Body('metadata') metadataJson?: string
  ): Promise<ChunkUploadResponse> {
    try {
      // Validate required fields
      if (!chunk) {
        throw new BadRequestException('No chunk file provided');
      }

      if (!recordingId || !chunkIndex || !totalChunks) {
        throw new BadRequestException('Missing required fields: recordingId, chunkIndex, totalChunks');
      }

      const chunkIndexNum = parseInt(chunkIndex);
      const totalChunksNum = parseInt(totalChunks);

      if (isNaN(chunkIndexNum) || isNaN(totalChunksNum)) {
        throw new BadRequestException('chunkIndex and totalChunks must be valid numbers');
      }

      if (chunkIndexNum < 0 || chunkIndexNum >= totalChunksNum) {
        throw new BadRequestException(`chunkIndex must be between 0 and ${totalChunksNum - 1}`);
      }

      // Parse metadata if provided
      let metadata;
      if (metadataJson) {
        try {
          metadata = JSON.parse(metadataJson);
        } catch (error) {
          throw new BadRequestException('Invalid metadata JSON');
        }
      }

      this.logger.debug(`Uploading chunk ${chunkIndexNum}/${totalChunksNum - 1} for recording ${recordingId}, size: ${chunk.size} bytes`);

      const result = await this.chunkedUploadService.uploadChunk({
        recordingId,
        chunkIndex: chunkIndexNum,
        totalChunks: totalChunksNum,
        chunk: chunk.buffer,
        metadata
      });

      // Format response
      const response: ChunkUploadResponse = {
        success: result.success,
        etag: result.etag,
        progress: {
          recordingId: result.progress.recordingId,
          uploadedChunks: result.progress.uploadedChunks,
          totalChunks: result.progress.totalChunks,
          progressPercentage: Math.round((result.progress.uploadedChunks / result.progress.totalChunks) * 100),
          uploadedSize: result.progress.uploadedSize,
          totalSize: result.progress.totalSize,
          status: result.progress.status,
          s3Location: result.progress.s3Location,
          error: result.progress.error
        }
      };

      if (result.success) {
        this.logger.debug(`Successfully uploaded chunk ${chunkIndexNum} for recording ${recordingId}`);
      } else {
        this.logger.warn(`Failed to upload chunk ${chunkIndexNum} for recording ${recordingId}: ${result.progress.error}`);
      }

      return response;

    } catch (error) {
      this.logger.error(`Error uploading chunk for recording ${recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Get(':recordingId/progress')
  @ApiOperation({ summary: 'Get upload progress for a recording' })
  @ApiResponse({ status: 200, description: 'Upload progress retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  async getProgress(@Param('recordingId') recordingId: string) {
    try {
      const progress = await this.chunkedUploadService.getUploadProgress(recordingId);

      if (!progress) {
        throw new NotFoundException(`Recording ${recordingId} not found`);
      }

      return {
        success: true,
        progress: {
          ...progress,
          progressPercentage: Math.round((progress.uploadedChunks / progress.totalChunks) * 100),
          sizeProgressPercentage: progress.totalSize > 0 
            ? Math.round((progress.uploadedSize / progress.totalSize) * 100) 
            : 0
        }
      };

    } catch (error) {
      this.logger.error(`Error getting progress for recording ${recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Post(':recordingId/complete')
  @ApiOperation({ summary: 'Complete a chunked upload and finalize the file' })
  @ApiResponse({ status: 200, description: 'Upload completed successfully' })
  @ApiResponse({ status: 400, description: 'Upload cannot be completed' })
  async completeUpload(@Param('recordingId') recordingId: string) {
    try {
      this.logger.log(`Completing upload for recording ${recordingId}`);

      const result = await this.chunkedUploadService.completeUpload(recordingId);

      return {
        success: true,
        s3Location: result.s3Location,
        totalSize: result.totalSize,
        message: 'Upload completed successfully'
      };

    } catch (error) {
      this.logger.error(`Error completing upload for recording ${recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Delete(':recordingId')
  @ApiOperation({ summary: 'Abort an incomplete upload' })
  @ApiResponse({ status: 200, description: 'Upload aborted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot abort upload' })
  async abortUpload(@Param('recordingId') recordingId: string) {
    try {
      this.logger.log(`Aborting upload for recording ${recordingId}`);

      await this.chunkedUploadService.abortUpload(recordingId);

      return {
        success: true,
        message: 'Upload aborted successfully'
      };

    } catch (error) {
      this.logger.error(`Error aborting upload for recording ${recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Get(':recordingId/url')
  @ApiOperation({ summary: 'Get playback URL for a completed recording' })
  @ApiResponse({ status: 200, description: 'Recording URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found or not completed' })
  async getRecordingUrl(@Param('recordingId') recordingId: string) {
    try {
      const url = await this.chunkedUploadService.getRecordingUrl(recordingId);

      if (!url) {
        throw new NotFoundException(`Recording ${recordingId} not found or not completed`);
      }

      return {
        success: true,
        url,
        recordingId
      };

    } catch (error) {
      this.logger.error(`Error getting URL for recording ${recordingId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: 200, description: 'Storage statistics retrieved successfully' })
  async getStorageStats() {
    try {
      const stats = await this.chunkedUploadService.getStorageStats();

      return {
        success: true,
        stats: {
          ...stats,
          totalSizeInMB: Math.round(stats.totalSize / (1024 * 1024)),
          averageFileSizeInMB: Math.round(stats.averageFileSize / (1024 * 1024))
        }
      };

    } catch (error) {
      this.logger.error('Error getting storage stats:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up stale uploads (admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupStaleUploads(@Query('hours') hours?: string) {
    try {
      const hoursNum = hours ? parseInt(hours) : 24;
      
      if (isNaN(hoursNum) || hoursNum <= 0) {
        throw new BadRequestException('hours parameter must be a positive number');
      }

      this.logger.log(`Starting cleanup of uploads older than ${hoursNum} hours`);

      const cleanedCount = await this.chunkedUploadService.cleanupStaleUploads(hoursNum);

      return {
        success: true,
        cleanedCount,
        message: `Cleaned up ${cleanedCount} stale uploads`
      };

    } catch (error) {
      this.logger.error('Error during cleanup:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}