import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DataRetentionService } from './data-retention.service';
import { DataRetentionController } from './data-retention.controller';
import { ArchivedRecord } from './entities/archived-record.entity';
import { RetentionPolicyEntity } from './entities/retention-policy.entity';
import { CommonModule } from '@clinic/common';

/**
 * Data Retention Module
 * 
 * Provides comprehensive data retention and archival capabilities for healthcare data.
 * Ensures HIPAA compliance with automated cleanup, secure archival, and audit trails.
 */

@Module({
  imports: [
    CommonModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      ArchivedRecord,
      RetentionPolicyEntity
    ])
  ],
  controllers: [
    DataRetentionController
  ],
  providers: [
    DataRetentionService
  ],
  exports: [
    DataRetentionService
  ]
})
export class DataRetentionModule {}