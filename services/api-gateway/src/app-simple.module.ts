import { Module } from '@nestjs/common';
import { HealthSimpleController } from './health/health-simple.controller';
import { HealthService } from './health/health.service';

@Module({
  imports: [],
  controllers: [HealthSimpleController],
  providers: [HealthService],
})
export class AppSimpleModule {}