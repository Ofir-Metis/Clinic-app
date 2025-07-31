import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './appointment.entity';
import { MeetingManagerService } from '../meetings/meeting-manager.service';
import { RecordingOrchestratorService } from '../recording/recording-orchestrator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
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
    RecordingOrchestratorService
  ],
  controllers: [AppointmentsController],
  exports: [
    AppointmentsService,
    MeetingManagerService,
    RecordingOrchestratorService
  ]
})
export class AppointmentsModule {}
