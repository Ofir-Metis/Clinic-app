import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { CoachesModule } from './coaches/coaches.module';
import { CommonModule } from '@clinic/common';
import { MockJwtService } from './mock-jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    // Use CommonModule for enterprise-grade database and logging
    CommonModule,
    CoachesModule,
  ],
  controllers: [HealthController],
  providers: [MockJwtService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AppModule {}
