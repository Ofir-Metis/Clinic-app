import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { GetClientAppointmentsDto } from './dto/get-client-appointments.dto';
import { createLogger, transports, format } from 'winston';

@Injectable()
export class ClientAppointmentsService {
  private logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  constructor(@InjectRepository(Appointment) private readonly repo: Repository<Appointment>) { }

  async list(query: GetClientAppointmentsDto) {
    const qb = this.repo.createQueryBuilder('a').where('a.patientId = :pid', { pid: query.patientId });
    if (query.therapistId) qb.andWhere('a.therapistId = :tid', { tid: query.therapistId });
    if (query.start) qb.andWhere('a.startTime >= :start', { start: query.start });
    if (query.end) qb.andWhere('a.endTime <= :end', { end: query.end });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await qb
      .orderBy('a.startTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    this.logger.info('list', { patientId: query.patientId, total });
    return { items, total };
  }

  async findOne(id: string) {
    const appt = await this.repo.findOne({ where: { id } });
    this.logger.info('findOne', { id });
    return appt;
  }
}
