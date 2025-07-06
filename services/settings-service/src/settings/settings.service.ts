import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createLogger, transports, format } from 'winston';
import { UserSettings } from './user-settings.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

/**
 * Service encapsulating user settings persistence.
 */
@Injectable()
export class SettingsService {
  private logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  constructor(
    @InjectRepository(UserSettings)
    private readonly repo: Repository<UserSettings>,
  ) {}

  async getSettings(userId: number) {
    this.logger.info('getSettings', { userId });
    return this.repo.find({ where: { userId } });
  }

  async updateSettings(userId: number, dto: UpdateSettingDto[]) {
    this.logger.info('updateSettings', { userId, count: dto.length });
    const results = [];
    for (const item of dto) {
      const existing = await this.repo.findOne({ where: { userId, key: item.key } });
      const entity = this.repo.create({ ...existing, userId, ...item });
      results.push(await this.repo.save(entity));
    }
    return results;
  }
}
