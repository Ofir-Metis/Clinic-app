import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TaxComplianceRecord } from '../entities/tax-compliance-record.entity';
import { TaxComplianceService } from './tax-compliance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxComplianceRecord]), 
    HttpModule,
    ConfigModule
  ],
  providers: [TaxComplianceService],
  exports: [TaxComplianceService],
})
export class TaxComplianceModule {}