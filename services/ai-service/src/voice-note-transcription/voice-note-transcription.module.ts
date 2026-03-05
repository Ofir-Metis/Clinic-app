import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VoiceNoteTranscriptionController } from './voice-note-transcription.controller';
import { VoiceNoteTranscriptionService } from './voice-note-transcription.service';
import { OpenaiService } from '../openai.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FILES_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'files-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
    ]),
  ],
  controllers: [VoiceNoteTranscriptionController],
  providers: [VoiceNoteTranscriptionService, OpenaiService],
  exports: [VoiceNoteTranscriptionService],
})
export class VoiceNoteTranscriptionModule {}
