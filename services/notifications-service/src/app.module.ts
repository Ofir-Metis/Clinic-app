import { Module } from '@nestjs/common';
import { CommonModule } from '@clinic/common';
import { HealthController } from './health/health.controller';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Enterprise CommonModule provides centralized config, logging, database, and security
    CommonModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
