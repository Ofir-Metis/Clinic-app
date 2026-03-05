/**
 * VoiceNoteTranscriptionService - Handles transcription of voice notes using OpenAI Whisper
 * Processes audio files from MinIO storage and sends results back to notes-service
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OpenaiService } from '../openai.service';
import axios from 'axios';

export interface TranscribeVoiceNoteRequest {
  voiceNoteId: string;
  audioFileKey: string;
  language?: string;
  coachId: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  confidence?: number;
  wordCount?: number;
  error?: string;
}

@Injectable()
export class VoiceNoteTranscriptionService {
  private readonly logger = new Logger(VoiceNoteTranscriptionService.name);
  private readonly filesServiceUrl: string;
  private readonly notesServiceUrl: string;

  constructor(
    private readonly openaiService: OpenaiService,
    @Inject('FILES_SERVICE') private readonly filesClient: ClientProxy,
  ) {
    this.filesServiceUrl = process.env.FILES_SERVICE_URL || 'http://files-service:3003';
    this.notesServiceUrl = process.env.NOTES_SERVICE_URL || 'http://notes-service:3006';
  }

  async transcribeVoiceNote(request: TranscribeVoiceNoteRequest): Promise<TranscriptionResult> {
    this.logger.log(`Starting transcription for voice note ${request.voiceNoteId}`);

    try {
      // 1. Update status to processing
      await this.updateVoiceNoteStatus(request.voiceNoteId, 'processing');

      // 2. Get signed download URL from files service
      const downloadUrl = await this.getDownloadUrl(request.audioFileKey);
      if (!downloadUrl) {
        throw new Error('Failed to get download URL for audio file');
      }

      // 3. Download audio file
      this.logger.debug(`Downloading audio from: ${downloadUrl}`);
      const audioResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout for large files
      });

      const audioBuffer = Buffer.from(audioResponse.data);
      this.logger.debug(`Downloaded audio file: ${audioBuffer.length} bytes`);

      // 4. Call OpenAI Whisper for transcription
      const transcriptionResult = await this.openaiService.transcribeAudio({
        audioBuffer,
        fileName: `${request.voiceNoteId}.webm`,
        language: request.language,
        prompt: 'This is a personal development coaching session voice note. The speaker is discussing goals, progress, challenges, and action items.',
      });

      // 5. Calculate word count
      const wordCount = transcriptionResult.text
        .split(/\s+/)
        .filter(Boolean).length;

      // 6. Update voice note with transcription
      await this.updateVoiceNoteTranscription(request.voiceNoteId, {
        transcription: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        wordCount,
      });

      this.logger.log(`Transcription completed for voice note ${request.voiceNoteId}: ${wordCount} words`);

      return {
        success: true,
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        confidence: transcriptionResult.confidence,
        wordCount,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Transcription failed for voice note ${request.voiceNoteId}: ${errorMessage}`);

      // Update status to failed
      await this.updateVoiceNoteStatus(request.voiceNoteId, 'failed', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async getDownloadUrl(fileKey: string): Promise<string | null> {
    try {
      // Try using HTTP call to files service
      const response = await axios.get(
        `${this.filesServiceUrl}/files/download-url/${encodeURIComponent(fileKey)}`,
        { timeout: 10000 }
      );

      if (response.data?.success && response.data?.url) {
        return response.data.url;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get download URL: ${errorMessage}`);
      return null;
    }
  }

  private async updateVoiceNoteStatus(
    voiceNoteId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      await axios.patch(
        `${this.notesServiceUrl}/voice-notes/${voiceNoteId}/transcription-status`,
        { status, error },
        { timeout: 10000 }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to update voice note status: ${errorMessage}`);
    }
  }

  private async updateVoiceNoteTranscription(
    voiceNoteId: string,
    data: {
      transcription: string;
      confidence: number;
      language: string;
      duration: number;
      wordCount: number;
    }
  ): Promise<void> {
    try {
      await axios.patch(
        `${this.notesServiceUrl}/voice-notes/${voiceNoteId}/transcription`,
        data,
        { timeout: 10000 }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to update voice note transcription: ${errorMessage}`);
      throw err; // Re-throw to mark transcription as failed
    }
  }
}
