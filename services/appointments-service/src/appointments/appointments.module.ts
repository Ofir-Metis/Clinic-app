import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './appointment.entity';
import { SessionRecording } from '../recording/recording.entity';
import { RecordingService } from '../recording/recording.service';
import { RecordingController } from '../recording/recording.controller';
import { MeetingManagerService } from '../meetings/meeting-manager.service';
import { RecordingOrchestratorService } from '../recording/recording-orchestrator.service';
import { MockJwtService } from '../mock-jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, SessionRecording]),
    ClientsModule.register([
      {
        name: 'GOOGLE_INTEGRATION_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
      {
        name: 'FILES_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      }
    ])
  ],
  providers: [
    AppointmentsService,
    MeetingManagerService,
    RecordingOrchestratorService,
    MockJwtService,
    RecordingService
  ],
  controllers: [AppointmentsController, RecordingController],
  exports: [
    AppointmentsService,
    MeetingManagerService,
    RecordingOrchestratorService,
    RecordingService
  ]
})
export class AppointmentsModule { }
