/**
 * AdminModule - System administration dashboard module
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from './database.module';
import { ComplianceModule } from '@clinic/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUtilsService } from './admin-utils.service';
import { AdminSetupController } from './admin-setup.controller';
import { AdminSetupService } from './admin-setup.service';
import { SecurityController } from '../security/security.controller';
import { SecurityService } from '../security/security.service';
import { BackupController } from '../backup/backup.controller';
import { BackupService } from '../backup/backup.service';
import { MonitoringController } from '../monitoring/monitoring.controller';
import { MonitoringService } from '../monitoring/monitoring.service';
import { ConfigController } from '../config/config.controller';
import { ConfigService } from '../config/config.service';
import { ComplianceController } from '../compliance/compliance.controller';
import { ComplianceService } from '../compliance/compliance.service';
import { ApiManagementController } from '../api-management/api-management.controller';
import { ApiManagementService } from '../api-management/api-management.service';
import { PerformanceController } from '../performance/performance.controller';
import { PerformanceService } from '../performance/performance.service';
import { AdminDatabaseService } from './admin-database.service';
import { JwtService, HIPAAComplianceService } from '@clinic/common';

@Module({
  imports: [
    HttpModule, 
    DatabaseModule,
    ComplianceModule.register({ isGlobal: false }), // Add compliance services for admin features
  ],
  controllers: [AdminController, AdminSetupController, SecurityController, BackupController, MonitoringController, ConfigController, ComplianceController, ApiManagementController, PerformanceController],
  providers: [AdminService, AdminUtilsService, AdminSetupService, SecurityService, BackupService, MonitoringService, ConfigService, ComplianceService, ApiManagementService, PerformanceService, AdminDatabaseService, JwtService, HIPAAComplianceService],
  exports: [AdminService, AdminUtilsService, AdminSetupService, SecurityService, BackupService, MonitoringService, ConfigService, ComplianceService, ApiManagementService, PerformanceService, AdminDatabaseService, DatabaseModule],
})
export class AdminModule {}