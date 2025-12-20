import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AssetsModule } from '../assets/assets.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AssetsModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}