import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientAppointmentsController } from './client-appointments.controller';
import { ClientAppointmentsService } from './client-appointments.service';
import { Appointment } from './appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [ClientAppointmentsController],
  providers: [ClientAppointmentsService],
})
export class ClientAppointmentsModule {}
