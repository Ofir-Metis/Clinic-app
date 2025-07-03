import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

/**
 * Service for managing appointments.
 */
@Injectable()
export class AppointmentsService {
  private client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: { url: process.env.NATS_URL || 'nats://localhost:4222' },
  });

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const appointment = this.repo.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
    const saved = await this.repo.save(appointment);
    this.client.emit('appointment.created', saved);
    return saved;
  }

  findAll() {
    return this.repo.find();
  }

  upcoming(limit: number) {
    return this.repo.find({ order: { startTime: 'ASC' }, take: limit });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    await this.repo.update(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return this.findOne(id);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}
