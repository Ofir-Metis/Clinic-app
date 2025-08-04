import { Module } from '@nestjs/common';
import { ComplianceModule as CommonComplianceModule } from '@clinic/common';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [
    // Import the compliance module from common library with healthcare defaults
    CommonComplianceModule.registerAsync({
      isGlobal: false,
      useFactory: () => ({
        auditRetentionDays: 2555, // 7 years for HIPAA compliance
        phiEncryptionKey: process.env.PHI_ENCRYPTION_KEY || process.env.JWT_SECRET,
        hipaaEnforcement: true,
        automaticReporting: true,
        complianceFrameworks: ['HIPAA', 'HITECH', 'SOC2']
      })
    })
  ],
  controllers: [ComplianceController],
  exports: []
})
export class ComplianceModule {}