/**
 * VoiceNoteTranscriptionController - Handles NATS events for voice note transcription
 * Listens for voice-note.transcribe events and processes them asynchronously
 */

import { Controller, Logger, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import {
  VoiceNoteTranscriptionService,
  TranscribeVoiceNoteRequest,
} from './voice-note-transcription.service';

@Controller('voice-note-transcription')
export class VoiceNoteTranscriptionController {
  private readonly logger = new Logger(VoiceNoteTranscriptionController.name);

  constructor(
    private readonly transcriptionService: VoiceNoteTranscriptionService,
  ) {}

  /**
   * Handle voice note transcription event from NATS
   * This is fired when a new voice note is created and needs transcription
   */
  @EventPattern('voice-note.transcribe')
  async handleVoiceNoteTranscription(
    @Payload() data: TranscribeVoiceNoteRequest,
  ): Promise<void> {
    this.logger.log(`Received transcription request for voice note ${data.voiceNoteId}`);

    try {
      const result = await this.transcriptionService.transcribeVoiceNote(data);

      if (result.success) {
        this.logger.log(
          `Transcription completed for voice note ${data.voiceNoteId}: ${result.wordCount} words`,
        );
      } else {
        this.logger.error(
          `Transcription failed for voice note ${data.voiceNoteId}: ${result.error}`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Unhandled error in transcription handler: ${errorMessage}`);
    }
  }

  /**
   * Synchronous message pattern for direct transcription requests
   * Returns the transcription result immediately
   */
  @MessagePattern('voice-note.transcribe.sync')
  async handleSyncTranscription(
    @Payload() data: TranscribeVoiceNoteRequest,
  ) {
    this.logger.log(`Received sync transcription request for voice note ${data.voiceNoteId}`);

    const result = await this.transcriptionService.transcribeVoiceNote(data);

    return {
      voiceNoteId: data.voiceNoteId,
      ...result,
    };
  }

  /**
   * HTTP endpoint for manual transcription trigger
   * Can be called from API Gateway for immediate transcription
   */
  @Post('transcribe')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerTranscription(
    @Body() data: TranscribeVoiceNoteRequest,
  ) {
    this.logger.log(`HTTP transcription request for voice note ${data.voiceNoteId}`);

    // Process asynchronously
    setImmediate(async () => {
      try {
        await this.transcriptionService.transcribeVoiceNote(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Async transcription failed: ${errorMessage}`);
      }
    });

    return {
      message: 'Transcription job started',
      voiceNoteId: data.voiceNoteId,
      status: 'processing',
    };
  }

  /**
   * Retry a failed transcription
   */
  @MessagePattern('voice-note.transcribe.retry')
  async handleRetryTranscription(
    @Payload() data: TranscribeVoiceNoteRequest,
  ) {
    this.logger.log(`Retrying transcription for voice note ${data.voiceNoteId}`);

    const result = await this.transcriptionService.transcribeVoiceNote(data);

    return {
      voiceNoteId: data.voiceNoteId,
      retried: true,
      ...result,
    };
  }
}
