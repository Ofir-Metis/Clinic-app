import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTrailService } from './audit-trail.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditEvent } from './entities/audit-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditEvent]),
  ],
  controllers: [AuditController],
  providers: [
    AuditTrailService,
    AuditInterceptor,
  ],
  exports: [
    AuditTrailService,
    AuditInterceptor,
  ],
})
export class AuditModule {}