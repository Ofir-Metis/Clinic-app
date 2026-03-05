/**
 * VoiceNotesService - Handles voice note operations for API Gateway
 * Manages file upload to MinIO and communication with notes-service
 */

import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface UploadVoiceNoteDto {
  durationSeconds: number;
  appointmentId?: string;
  clientId?: string;
  title?: string;
  sessionTimestamp?: number;
  language?: string;
}

@Injectable()
export class VoiceNotesService {
  private readonly logger = new Logger(VoiceNotesService.name);
  private readonly notesServiceUrl: string;
  private readonly filesServiceUrl: string;
  private readonly aiServiceUrl: string;

  constructor(
    @Inject('NOTES_SERVICE') private readonly notesClient: ClientProxy,
    @Inject('AI_SERVICE') private readonly aiClient: ClientProxy,
  ) {
    this.notesServiceUrl = process.env.NOTES_SERVICE_URL || 'http://notes-service:3006';
    this.filesServiceUrl = process.env.FILES_SERVICE_URL || 'http://files-service:3003';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:3005';
  }

  async uploadVoiceNote(
    coachId: string,
    file: Express.Multer.File,
    dto: UploadVoiceNoteDto,
  ) {
    try {
      // 1. Generate unique file key with proper extension
      const extension = file.mimetype === 'audio/wav' || file.mimetype === 'audio/wave' || file.mimetype === 'audio/x-wav'
        ? 'wav'
        : file.mimetype === 'audio/ogg'
        ? 'ogg'
        : file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3'
        ? 'mp3'
        : file.mimetype === 'audio/mp4' || file.mimetype === 'audio/x-m4a'
        ? 'm4a'
        : file.mimetype === 'video/mp4'
        ? 'mp4'
        : 'webm'; // default for audio/webm and video/webm

      const fileKey = `voice-notes/${coachId}/${uuidv4()}.${extension}`;

      // 2. Get upload URL from files service (includes size validation)
      const uploadUrlResponse = await axios.get(
        `${this.filesServiceUrl}/files/upload-url/${encodeURIComponent(fileKey)}`,
        { timeout: 10000 }
      );

      if (!uploadUrlResponse.data?.success || !uploadUrlResponse.data?.url) {
        throw new HttpException(
          'Failed to get upload URL',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { url: uploadUrl, maxSizeBytes } = uploadUrlResponse.data;

      // Validate file size against the limit returned by files service
      if (file.size > maxSizeBytes) {
        const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new HttpException(
          `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Upload file to MinIO
      await axios.put(uploadUrl, file.buffer, {
        headers: {
          'Content-Type': file.mimetype || 'audio/webm',
          'Content-Length': file.size,
        },
        timeout: 60000, // 60 seconds for large files
      });

      this.logger.log(`Uploaded audio file to ${fileKey} (${file.size} bytes)`);

      // 4. Create voice note record in notes-service
      const createResponse = await axios.post(
        `${this.notesServiceUrl}/voice-notes`,
        {
          audioFileKey: fileKey,
          durationSeconds: dto.durationSeconds,
          fileSizeBytes: file.size,
          mimeType: file.mimetype || 'audio/webm',
          appointmentId: dto.appointmentId,
          clientId: dto.clientId,
          title: dto.title,
          sessionTimestamp: dto.sessionTimestamp,
        },
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      const voiceNote = createResponse.data;
      this.logger.log(`Created voice note ${voiceNote.id}`);

      // 5. Queue transcription job via NATS
      try {
        this.aiClient.emit('voice-note.transcribe', {
          voiceNoteId: voiceNote.id,
          audioFileKey: fileKey,
          language: dto.language || 'auto',
          coachId,
        });
        this.logger.log(`Queued transcription for voice note ${voiceNote.id}`);
      } catch (natsError) {
        // Log but don't fail - transcription can be retried later
        const errorMessage = natsError instanceof Error ? natsError.message : 'Unknown error';
        this.logger.warn(`Failed to queue transcription: ${errorMessage}`);
      }

      return {
        id: voiceNote.id,
        transcriptionStatus: 'pending',
        audioFileKey: fileKey,
        durationSeconds: dto.durationSeconds,
        estimatedTranscriptionTime: Math.ceil(dto.durationSeconds / 60) * 15, // ~15 seconds per minute
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload voice note: ${errorMessage}`);
      throw new HttpException(
        `Failed to upload voice note: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    coachId: string,
    query: {
      appointmentId?: string;
      clientId?: string;
      status?: string;
      search?: string;
      language?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: string;
      offset?: string;
    },
  ) {
    try {
      const params = new URLSearchParams();
      if (query.appointmentId) params.append('appointmentId', query.appointmentId);
      if (query.clientId) params.append('clientId', query.clientId);
      if (query.status) params.append('status', query.status);
      if (query.search) params.append('search', query.search);
      if (query.language) params.append('language', query.language);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      if (query.limit) params.append('limit', query.limit);
      if (query.offset) params.append('offset', query.offset);

      const response = await axios.get(
        `${this.notesServiceUrl}/voice-notes?${params.toString()}`,
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      // Add signed audio URLs for each voice note
      const voiceNotes = response.data;
      if (voiceNotes.items) {
        for (const note of voiceNotes.items) {
          note.audioUrl = await this.getSignedUrl(note.audioFileKey);
        }
      }

      return voiceNotes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch voice notes: ${errorMessage}`);
      throw new HttpException(
        'Failed to fetch voice notes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, coachId: string) {
    try {
      const response = await axios.get(
        `${this.notesServiceUrl}/voice-notes/${id}`,
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      const voiceNote = response.data;

      // Add signed audio URL
      voiceNote.audioUrl = await this.getSignedUrl(voiceNote.audioFileKey);

      return voiceNote;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('Voice note not found', HttpStatus.NOT_FOUND);
      }
      if (error.response?.status === 403) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch voice note: ${errorMessage}`);
      throw new HttpException(
        'Failed to fetch voice note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    coachId: string,
    dto: {
      transcription?: string;
      title?: string;
      tags?: string[];
      isPrivate?: boolean;
    },
  ) {
    try {
      const response = await axios.patch(
        `${this.notesServiceUrl}/voice-notes/${id}`,
        dto,
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('Voice note not found', HttpStatus.NOT_FOUND);
      }
      if (error.response?.status === 403) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update voice note: ${errorMessage}`);
      throw new HttpException(
        'Failed to update voice note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string, coachId: string) {
    try {
      // Get voice note to get file key
      const voiceNote = await this.findOne(id, coachId);

      // Delete from notes service
      await axios.delete(`${this.notesServiceUrl}/voice-notes/${id}`, {
        headers: { 'x-coach-id': coachId },
        timeout: 10000,
      });

      // Delete audio file from storage (best effort)
      try {
        await axios.delete(
          `${this.filesServiceUrl}/files/${encodeURIComponent(voiceNote.audioFileKey)}`,
          { timeout: 10000 }
        );
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
        this.logger.warn(`Failed to delete audio file: ${errorMessage}`);
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete voice note: ${errorMessage}`);
      throw new HttpException(
        'Failed to delete voice note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async convertToNote(
    id: string,
    coachId: string,
    dto: {
      entityType: 'appointment' | 'client' | 'patient';
      entityId: string;
      additionalContent?: string;
    },
  ) {
    try {
      const response = await axios.post(
        `${this.notesServiceUrl}/voice-notes/${id}/convert-to-note`,
        dto,
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new HttpException(
          error.response?.data?.message || 'Cannot convert voice note',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error.response?.status === 404) {
        throw new HttpException('Voice note not found', HttpStatus.NOT_FOUND);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to convert voice note: ${errorMessage}`);
      throw new HttpException(
        'Failed to convert voice note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async retryTranscription(id: string, coachId: string) {
    try {
      // Update status in notes service
      const response = await axios.post(
        `${this.notesServiceUrl}/voice-notes/${id}/retry-transcription`,
        {},
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );

      const voiceNote = response.data;

      // Re-queue transcription job
      this.aiClient.emit('voice-note.transcribe', {
        voiceNoteId: voiceNote.id,
        audioFileKey: voiceNote.audioFileKey,
        language: 'auto',
        coachId,
      });

      return {
        message: 'Transcription retry initiated',
        voiceNoteId: voiceNote.id,
        status: 'pending',
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new HttpException(
          error.response?.data?.message || 'Cannot retry transcription',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error.response?.status === 404) {
        throw new HttpException('Voice note not found', HttpStatus.NOT_FOUND);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retry transcription: ${errorMessage}`);
      throw new HttpException(
        'Failed to retry transcription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Phase 5: Analytics endpoint
  async getAnalytics(coachId: string, days: number = 30) {
    try {
      const response = await axios.get(
        `${this.notesServiceUrl}/voice-notes/analytics/summary?days=${days}`,
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch analytics: ${errorMessage}`);
      throw new HttpException(
        'Failed to fetch voice note analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Phase 5: Batch transcription endpoint
  async batchTranscribe(coachId: string, voiceNoteIds: string[]) {
    try {
      const response = await axios.post(
        `${this.notesServiceUrl}/voice-notes/batch/transcribe`,
        { voiceNoteIds },
        {
          headers: { 'x-coach-id': coachId },
          timeout: 30000, // Longer timeout for batch operations
        }
      );

      const result = response.data;

      // Queue transcription jobs only for actually-queued voice notes
      // The notes-service returns { queued, failed } - notes that were already
      // completed/processing are silently skipped (not in queued count or failed list)
      if (result.queued > 0) {
        // Fetch each note to check its current status before queuing
        for (const id of voiceNoteIds) {
          if (result.failed?.includes(id)) continue;
          try {
            const voiceNote = await this.findOne(id, coachId);
            // Only queue NATS event if the note is actually pending
            if (voiceNote.transcriptionStatus === 'pending') {
              this.aiClient.emit('voice-note.transcribe', {
                voiceNoteId: id,
                audioFileKey: voiceNote.audioFileKey,
                language: 'auto',
                coachId,
              });
            }
          } catch (e) {
            this.logger.warn(`Failed to queue transcription for ${id}`);
          }
        }
      }

      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to batch transcribe: ${errorMessage}`);
      throw new HttpException(
        'Failed to batch transcribe voice notes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Phase 5: Auto-tag endpoint
  async autoTag(id: string, coachId: string) {
    try {
      const response = await axios.post(
        `${this.notesServiceUrl}/voice-notes/${id}/auto-tag`,
        {},
        {
          headers: { 'x-coach-id': coachId },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('Voice note not found', HttpStatus.NOT_FOUND);
      }
      if (error.response?.status === 403) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to auto-tag: ${errorMessage}`);
      throw new HttpException(
        'Failed to auto-tag voice note',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Phase 5: Supported languages endpoint
  async getSupportedLanguages() {
    try {
      const response = await axios.get(
        `${this.notesServiceUrl}/voice-notes/config/languages`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get supported languages: ${errorMessage}`);
      throw new HttpException(
        'Failed to get supported languages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getSignedUrl(fileKey: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.filesServiceUrl}/files/download-url/${encodeURIComponent(fileKey)}`,
        { timeout: 5000 }
      );

      if (response.data?.success && response.data?.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get signed URL for ${fileKey}: ${errorMessage}`);
      return null;
    }
  }
}
