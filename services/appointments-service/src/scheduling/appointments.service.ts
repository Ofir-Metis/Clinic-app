import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Client } from '../clients/client.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import * as winston from 'winston';
import { NotificationsService } from './notifications.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = winston.createLogger({
    transports: [new winston.transports.Console()],
  });
  private client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: { url: process.env.NATS_URL },
  });

  constructor(
    @InjectRepository(Appointment) private readonly repo: Repository<Appointment>,
    @InjectRepository(Client) private readonly patients: Repository<Client>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const patient = await this.patients.findOne({ where: { id: dto.patientId } });
    if (!patient) {
      this.logger.error('Client not found', { patientId: dto.patientId });
      throw new Error('Client not found');
    }

    const entity = this.repo.create({
      patientId: dto.patientId,
      datetime: new Date(dto.datetime),
      serviceType: dto.serviceType
    });
    const saved = await this.repo.save(entity);
    if (entity.datetime < new Date()) {
      this.logger.warn('Appointment scheduled in the past', { appointmentId: saved.id });
    } else {
      this.logger.info('Appointment scheduled', { appointmentId: saved.id });
    }
    this.client.emit('AppointmentCreated', {
      appointmentId: saved.id,
      patientId: saved.patientId,
      datetime: saved.datetime.toISOString(),
    });
    await this.notifications.sendAppointmentInvite(patient.email, saved);
    return saved;
  }
}
