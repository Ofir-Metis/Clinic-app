import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { SessionNote } from './session-note.entity';
import { CreatePatientDto } from "./dto/create-patient.dto";
import { Invoice } from './invoice.entity';

/**
 * Service providing patient queries.
 */
@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private readonly repo: Repository<Patient>,
    @InjectRepository(SessionNote)
    private readonly notes: Repository<SessionNote>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
  ) {}

  private readonly logger = new Logger(PatientsService.name);

  async list(therapistId: number, page: number, limit: number, search?: string) {
    const qb = this.repo.createQueryBuilder('p').where('p.therapistId = :therapistId', { therapistId });
    if (search) {
      qb.andWhere('(p.firstName ILIKE :s OR p.lastName ILIKE :s OR p.email ILIKE :s)', { s: `%${search}%` });
    }
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total };
  }

  getDetail(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async sessions(patientId: number, page: number, limit: number) {
    return this.notes.find({
      where: { patientId },
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  files(patientId: number) {
    return [];
  }

  billing(patientId: number) {
    return this.invoices.find({ where: { patientId } });
  }

  async addOrInvite(dto: CreatePatientDto, therapistId: number) {
    let patient = await this.repo.findOne({ where: { email: dto.email } });
    const existing = !!patient;
    if (!existing) {
      patient = this.repo.create({ ...dto, therapistId });
      await this.repo.save(patient);
      this.logger.log(`Created new patient ${patient.email}`);
    } else {
      if (patient) {
        await this.linkTherapist(patient, therapistId);
        this.logger.log(`Patient ${patient.email} already exists`);
      }
    }
    return { patient, existing };
  }

  private async linkTherapist(patient: Patient, therapistId: number) {
    if (patient.therapistId !== therapistId) {
      await this.repo.update(patient.id, { therapistId });
    }
  }
}
