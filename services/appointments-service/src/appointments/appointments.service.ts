import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { createLogger, transports, format } from 'winston';

/**
 * Service for managing appointments.
 */
@Injectable()
export class AppointmentsService {
  private client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: { url: process.env.NATS_URL || 'nats://localhost:4222' },
  });

  private readonly logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    this.logger.info('create', { therapistId: dto.therapistId });
    const appointment = this.repo.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
    const saved = await this.repo.save(appointment);
    this.client.emit('appointment.created', saved);
    return saved;
  }

  findAll(filter: GetAppointmentsDto) {
    this.logger.info('findAll', { therapistId: filter.therapistId });
    return this.repo.find({
      where: { therapistId: filter.therapistId },
      order: { startTime: 'ASC' },
    });
  }

  upcoming(limit: number) {
    return this.repo.find({ order: { startTime: 'ASC' }, take: limit });
  }

  async findHistory(userId: number) {
    this.logger.info('findHistory', { userId });
    return this.repo.find({
      where: { therapistId: userId },
      order: { startTime: 'DESC' },
    });
  }

  async history(query: GetHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    this.logger.log(`History query therapist=${query.therapistId} page=${page}`);
    return this.repo.find({
      where: { therapistId: query.therapistId },
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findOne(id: number) {
    this.logger.info('findOne', { id });
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateAppointmentDto, userId?: number) {
    const appt = await this.findOne(id);
    if (!appt || (userId && appt.therapistId !== userId)) {
      this.logger.error('update forbidden', { id, userId });
      throw new ForbiddenException();
    }
    this.logger.info('update', { id });
    await this.repo.update(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    const updated = await this.findOne(id);
    if (dto.status === 'cancelled') {
      this.client.emit('appointment.cancelled', updated);
    } else {
      this.client.emit('appointment.updated', updated);
    }
    return updated;
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
