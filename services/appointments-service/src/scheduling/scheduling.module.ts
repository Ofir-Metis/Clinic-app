import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { Client } from '../clients/client.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Client])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, NotificationsService],
})
export class SchedulingModule {}
