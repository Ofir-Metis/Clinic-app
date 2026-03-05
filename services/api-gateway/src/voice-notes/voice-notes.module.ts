import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MulterModule } from '@nestjs/platform-express';
import { VoiceNotesController } from './voice-notes.controller';
import { VoiceNotesService } from './voice-notes.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max (about 30 min audio)
      },
    }),
    ClientsModule.register([
      {
        name: 'NOTES_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'notes-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
      {
        name: 'AI_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
          queue: 'ai-service-queue',
          maxReconnectAttempts: 10,
          reconnectTimeWait: 2000,
        },
      },
    ]),
  ],
  controllers: [VoiceNotesController],
  providers: [VoiceNotesService],
  exports: [VoiceNotesService],
})
export class VoiceNotesModule {}
