import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingController, RecordingConsentController } from './recording.controller';
import { RecordingService } from './recording.service';
import { SessionRecording } from './recording.entity';
import { Appointment } from '../appointments/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionRecording, Appointment]),
  ],
  controllers: [RecordingController, RecordingConsentController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
