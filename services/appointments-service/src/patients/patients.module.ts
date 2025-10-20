import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';
import { SessionNote } from './session-note.entity';
import { Invoice } from './invoice.entity';
import { NotifierService } from './notifier.service';
import { MockJwtService } from '../mock-jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, SessionNote, Invoice])],
  controllers: [PatientsController],
  providers: [PatientsService, NotifierService, MockJwtService],
})
export class PatientsModule {}
