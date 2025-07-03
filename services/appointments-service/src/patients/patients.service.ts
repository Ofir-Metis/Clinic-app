import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

/**
 * Service providing patient queries.
 */
@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private readonly repo: Repository<Patient>) {}

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
}
