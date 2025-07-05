import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TherapistProfile } from './therapist-profile.entity';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto';
import { createLogger, transports, format } from 'winston';

/**
 * Service providing therapist profile operations.
 */
@Injectable()
export class TherapistsService {
  private logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  constructor(
    @InjectRepository(TherapistProfile)
    private readonly repo: Repository<TherapistProfile>,
  ) {}

  async getProfile(userId: number) {
    this.logger.info('getProfile', { userId });
    return this.repo.findOne({ where: { userId } });
  }

  async updateProfile(userId: number, dto: UpdateTherapistProfileDto) {
    const existing = await this.getProfile(userId);
    const profile = this.repo.create({ ...existing, userId, ...dto });
    this.logger.info('updateProfile', { userId, changes: Object.keys(dto) });
    return this.repo.save(profile);
  }
}
