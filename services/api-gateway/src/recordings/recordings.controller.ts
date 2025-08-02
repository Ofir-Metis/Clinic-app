/**
 * RecordingsController - Handles recording file uploads, downloads, and management
 * Integrates with StorageService for S3/MinIO operations
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpException,
  HttpStatus,
  Headers,
  Res,
  StreamableFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { 
  StorageService, 
  LoggingInterceptor,
  JwtAuthGuard,
  RecordingAccessGuard,
  AdminGuard,
  RequirePermissions,
  RequireRoles,
  JwtPayload
} from '@clinic/common';
import { UseInterceptors as UseLoggingInterceptor } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface RecordingUploadDto {
  appointmentId: string;
  sessionId: string;
  participantId: string;
  recordingMode: 'video' | 'audio' | 'screen';
  sessionType: 'in-person' | 'online' | 'hybrid';
  userId: string;
  userRole: 'coach' | 'client';
}

interface RecordingMetadata {
  appointmentId: string;
  sessionId: string;
  participantId: string;
  userId: string;
  userRole: string;
  recordingMode: string;
  sessionType: string;
  uploadDate: string;
  fileSize: number;
  duration?: number;
  format: string;
}

@Controller('api/recordings')
@UseGuards(JwtAuthGuard)
@UseLoggingInterceptor(LoggingInterceptor)
class RecordingsController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload a recording file
   */
  @Post('upload')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('recordings:write')
  @UseInterceptors(
    FileInterceptor('recording', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'audio/mpeg',
          'audio/wav',
          'audio/mp4',
          'video/webm',
          'audio/webm',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
        }
      },
    })
  )
  async uploadRecording(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: RecordingUploadDto,
    @Request() req: any
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate metadata
      if (!metadata.appointmentId || !metadata.sessionId || !metadata.participantId) {
        throw new HttpException('Missing required metadata', HttpStatus.BAD_REQUEST);
      }

      // Generate safe filename
      const fileExtension = path.extname(file.originalname);
      const safeFilename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to storage
      const uploadResult = await this.storageService.uploadRecording(
        file.buffer,
        safeFilename,
        metadata.appointmentId,
        metadata.sessionId,
        {
          contentType: file.mimetype,
          metadata: {
            ...metadata,
            originalFilename: file.originalname,
            fileSize: file.size.toString(),
            uploadDate: new Date().toISOString(),
            uploadedBy: req.user.sub,
            uploaderRole: req.user.role,
          },
          tags: {
            type: 'recording',
            appointmentId: metadata.appointmentId,
            sessionId: metadata.sessionId,
            participantId: metadata.participantId,
          },
          encryption: true, // Enable server-side encryption
        }
      );

      return {
        id: uploadResult.uploadId,
        filename: file.originalname,
        fileSize: file.size,
        format: file.mimetype,
        uploadUrl: uploadResult.location,
        key: uploadResult.key,
        processingStatus: 'completed',
        uploadDate: new Date().toISOString(),
        metadata: {
          appointmentId: metadata.appointmentId,
          sessionId: metadata.sessionId,
          participantId: metadata.participantId,
          recordingMode: metadata.recordingMode,
          sessionType: metadata.sessionType,
        },
      };
    } catch (error) {
      console.error('Recording upload failed:', error);
      throw new HttpException('Upload failed: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get recordings for an appointment
   */
  @Get('appointments/:appointmentId')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('recordings:read')
  async getAppointmentRecordings(
    @Param('appointmentId') appointmentId: string,
    @Request() req: any
  ) {
    try {
      const prefix = `recordings/${appointmentId}/`;
      const result = await this.storageService.listFiles(
        'clinic-recordings', // This should be from config
        prefix
      );

      const recordings = await Promise.all(
        result.files.map(async (file) => {
          const metadata = await this.storageService.getFileMetadata(
            'clinic-recordings',
            file.key
          );

          return {
            id: metadata.metadata.uploadId || file.key,
            filename: metadata.metadata.originalFilename || path.basename(file.key),
            fileSize: file.size,
            duration: parseInt(metadata.metadata.duration || '0'),
            uploadDate: file.lastModified,
            recordingDate: metadata.metadata.recordingDate 
              ? new Date(metadata.metadata.recordingDate) 
              : file.lastModified,
            format: metadata.contentType,
            key: file.key,
            processingStatus: 'completed',
            metadata: metadata.metadata,
          };
        })
      );

      return recordings;
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      throw new HttpException('Failed to load recordings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a signed download URL for a recording
   */
  @Get(':recordingId/download-url')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('recordings:read')
  async getDownloadUrl(
    @Param('recordingId') recordingId: string,
    @Request() req: any
  ) {
    try {
      // In a real implementation, you'd need to map recordingId to the actual storage key
      // For now, we'll assume the recordingId is part of the key or we can lookup the key
      const recordings = await this.storageService.listFiles(
        'clinic-recordings',
        '', // Search all recordings
        1000
      );

      const recording = recordings.files.find(file => 
        file.key.includes(recordingId) || 
        file.key.endsWith(`${recordingId}_*`)
      );

      if (!recording) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      const downloadUrl = await this.storageService.getRecordingDownloadUrl(
        recording.key,
        3600 // 1 hour expiry
      );

      return { downloadUrl };
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      throw new HttpException('Failed to generate download URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a signed playback URL for a recording
   */
  @Get(':recordingId/playback-url')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('recordings:read')
  async getPlaybackUrl(
    @Param('recordingId') recordingId: string,
    @Request() req: any
  ) {
    try {
      const recordings = await this.storageService.listFiles(
        'clinic-recordings',
        '',
        1000
      );

      const recording = recordings.files.find(file => 
        file.key.includes(recordingId)
      );

      if (!recording) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      const playbackUrl = await this.storageService.getRecordingPlaybackUrl(
        recording.key,
        3600 // 1 hour expiry
      );

      return { playbackUrl };
    } catch (error) {
      console.error('Failed to generate playback URL:', error);
      throw new HttpException('Failed to generate playback URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a recording
   */
  @Delete(':recordingId')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('recordings:delete')
  @RequireRoles('coach', 'admin')
  async deleteRecording(
    @Param('recordingId') recordingId: string,
    @Request() req: any
  ) {
    try {
      const recordings = await this.storageService.listFiles(
        'clinic-recordings',
        '',
        1000
      );

      const recording = recordings.files.find(file => 
        file.key.includes(recordingId)
      );

      if (!recording) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      await this.storageService.deleteFile('clinic-recordings', recording.key);

      return { message: 'Recording deleted successfully' };
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw new HttpException('Failed to delete recording', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate AI summary for a recording
   */
  @Post(':recordingId/generate-summary')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('ai:generate-summary')
  @RequireRoles('coach', 'admin')
  async generateSummary(
    @Param('recordingId') recordingId: string,
    @Request() req: any
  ) {
    try {
      // This would integrate with the AI service
      // For now, return a mock summary
      const mockSummary = {
        id: `summary_${recordingId}`,
        recordingId,
        keyPoints: [
          'Client expressed increased confidence in handling workplace stress',
          'Discussion around new coping strategies for anxiety management',
          'Progress noted in maintaining healthy sleep schedule',
        ],
        actionItems: [
          'Practice daily 10-minute meditation using guided app',
          'Implement the "2-minute rule" for task management',
          'Schedule weekly nature walks for stress relief',
        ],
        insights: [
          'Client shows strong self-awareness and motivation for change',
          'Cognitive reframing techniques are resonating well',
          'Previous session goals have been partially achieved',
        ],
        recommendations: [
          'Continue building on mindfulness practices',
          'Explore additional stress management techniques',
          'Consider introducing goal-setting framework',
        ],
        mood: 'Optimistic and engaged',
        progressNotes: 'Client is making steady progress with anxiety management.',
        nextSessionFocus: 'Goal setting and action planning for workplace stress scenarios',
        generatedAt: new Date().toISOString(),
        isSharedWithClient: false,
      };

      // Store summary in storage
      await this.storageService.uploadSummary(
        mockSummary,
        recordingId,
        'appointment-id', // This should come from the recording metadata
        {
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
          },
        }
      );

      return mockSummary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      throw new HttpException('Failed to generate summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate transcript for a recording
   */
  @Post(':recordingId/generate-transcript')
  @UseGuards(RecordingAccessGuard)
  @RequirePermissions('ai:generate-transcript')
  @RequireRoles('coach', 'admin')
  async generateTranscript(
    @Param('recordingId') recordingId: string,
    @Request() req: any
  ) {
    try {
      // This would integrate with the AI service (Whisper API)
      // For now, return a mock transcript
      const mockTranscript = {
        id: `transcript_${recordingId}`,
        recordingId,
        content: 'Mock transcript content would go here...',
        speakerLabels: [
          {
            speaker: 'Coach',
            startTime: 0,
            endTime: 30,
            text: 'How are you feeling today?',
          },
          {
            speaker: 'Client',
            startTime: 30,
            endTime: 60,
            text: 'I\'m feeling much better than last week.',
          },
        ],
        generatedAt: new Date().toISOString(),
        accuracy: 0.95,
      };

      // Store transcript in storage
      await this.storageService.uploadTranscript(
        JSON.stringify(mockTranscript),
        recordingId,
        {
          metadata: {
            generatedAt: new Date().toISOString(),
            accuracy: '0.95',
          },
        }
      );

      return mockTranscript;
    } catch (error) {
      console.error('Failed to generate transcript:', error);
      throw new HttpException('Failed to generate transcript', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get storage statistics
   */
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @RequireRoles('admin', 'coach')
  async getStorageStats(@Request() req: any) {
    try {
      const stats = await this.storageService.getStorageStats();
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new HttpException('Failed to get storage statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Health check for storage service
   */
  @Get('admin/health')
  @UseGuards(AdminGuard)
  @RequireRoles('admin', 'coach')
  async healthCheck(@Request() req: any) {
    try {
      const health = await this.storageService.healthCheck();
      return health;
    } catch (error) {
      console.error('Storage health check failed:', error);
      throw new HttpException('Storage service unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}

export { RecordingsController };