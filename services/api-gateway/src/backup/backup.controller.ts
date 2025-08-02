/**
 * BackupController - System backup and disaster recovery management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common/auth/jwt-auth.guard';
import { BackupService } from './backup.service';

export interface BackupCreateRequest {
  type: 'full' | 'incremental' | 'differential';
  description?: string;
  retentionDays?: number;
  compression?: boolean;
  encryption?: boolean;
}

export interface RestoreRequest {
  backupId: string;
  targetEnvironment?: 'current' | 'staging' | 'test';
  restoreOptions: {
    database: boolean;
    files: boolean;
    configuration: boolean;
  };
  confirmationCode: string;
}

export interface BackupScheduleRequest {
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string; // cron expression
  retentionDays: number;
  enabled: boolean;
  compression: boolean;
  encryption: boolean;
  destinations: string[];
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rtoMinutes: number; // Recovery Time Objective
  rpoMinutes: number; // Recovery Point Objective
  steps: RecoveryStep[];
  testResults?: TestResult[];
}

export interface RecoveryStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'automatic' | 'manual' | 'verification';
  estimatedDuration: number;
  dependencies: string[];
  commands?: string[];
}

export interface TestResult {
  id: string;
  testDate: Date;
  success: boolean;
  duration: number;
  issues: string[];
  tester: string;
}

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(private backupService: BackupService) {}

  /**
   * Get backup overview and status
   */
  @Get('overview')
  @RequireRoles('admin')
  async getBackupOverview(@Request() req: any) {
    try {
      const overview = await this.backupService.getBackupOverview();
      
      this.logger.log(`Admin ${req.user.sub} viewed backup overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get backup overview:', error);
      throw new HttpException(
        'Failed to retrieve backup overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get list of all backups
   */
  @Get('list')
  @RequireRoles('admin')
  async getBackups(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      const backups = await this.backupService.getBackups({
        limit,
        offset,
        type,
        status,
      });
      
      return {
        success: true,
        data: backups,
      };
    } catch (error) {
      this.logger.error('Failed to get backups:', error);
      throw new HttpException(
        'Failed to retrieve backups',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new backup
   */
  @Post('create')
  @RequireRoles('admin')
  async createBackup(
    @Body() backupRequest: BackupCreateRequest,
    @Request() req: any,
  ) {
    try {
      const backup = await this.backupService.createBackup(
        backupRequest,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} initiated ${backupRequest.type} backup`
      );
      
      return {
        success: true,
        data: backup,
        message: 'Backup initiated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw new HttpException(
        'Failed to create backup',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get backup details
   */
  @Get(':backupId')
  @RequireRoles('admin')
  async getBackupDetails(
    @Param('backupId') backupId: string,
    @Request() req: any,
  ) {
    try {
      const backup = await this.backupService.getBackupDetails(backupId);
      
      return {
        success: true,
        data: backup,
      };
    } catch (error) {
      this.logger.error(`Failed to get backup ${backupId}:`, error);
      throw new HttpException(
        'Failed to retrieve backup details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a backup
   */
  @Delete(':backupId')
  @RequireRoles('admin')
  async deleteBackup(
    @Param('backupId') backupId: string,
    @Request() req: any,
  ) {
    try {
      await this.backupService.deleteBackup(backupId, req.user.sub);
      
      this.logger.log(`Admin ${req.user.sub} deleted backup ${backupId}`);
      
      return {
        success: true,
        message: 'Backup deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete backup ${backupId}:`, error);
      throw new HttpException(
        'Failed to delete backup',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Restore from backup
   */
  @Post('restore')
  @RequireRoles('admin')
  async restoreBackup(
    @Body() restoreRequest: RestoreRequest,
    @Request() req: any,
  ) {
    try {
      const result = await this.backupService.restoreBackup(
        restoreRequest,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} initiated restore from backup ${restoreRequest.backupId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Restore initiated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to restore backup:', error);
      throw new HttpException(
        'Failed to restore backup',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Backup Schedule Management
   */
  @Get('schedules/list')
  @RequireRoles('admin')
  async getBackupSchedules(@Request() req: any) {
    try {
      const schedules = await this.backupService.getBackupSchedules();
      
      return {
        success: true,
        data: schedules,
      };
    } catch (error) {
      this.logger.error('Failed to get backup schedules:', error);
      throw new HttpException(
        'Failed to retrieve backup schedules',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('schedules/create')
  @RequireRoles('admin')
  async createBackupSchedule(
    @Body() scheduleRequest: BackupScheduleRequest,
    @Request() req: any,
  ) {
    try {
      const schedule = await this.backupService.createBackupSchedule(
        scheduleRequest,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} created backup schedule: ${scheduleRequest.name}`);
      
      return {
        success: true,
        data: schedule,
        message: 'Backup schedule created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create backup schedule:', error);
      throw new HttpException(
        'Failed to create backup schedule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('schedules/:scheduleId')
  @RequireRoles('admin')
  async updateBackupSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() scheduleRequest: Partial<BackupScheduleRequest>,
    @Request() req: any,
  ) {
    try {
      const schedule = await this.backupService.updateBackupSchedule(
        scheduleId,
        scheduleRequest,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} updated backup schedule ${scheduleId}`);
      
      return {
        success: true,
        data: schedule,
        message: 'Backup schedule updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update backup schedule:', error);
      throw new HttpException(
        'Failed to update backup schedule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('schedules/:scheduleId')
  @RequireRoles('admin')
  async deleteBackupSchedule(
    @Param('scheduleId') scheduleId: string,
    @Request() req: any,
  ) {
    try {
      await this.backupService.deleteBackupSchedule(scheduleId, req.user.sub);
      
      this.logger.log(`Admin ${req.user.sub} deleted backup schedule ${scheduleId}`);
      
      return {
        success: true,
        message: 'Backup schedule deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete backup schedule:', error);
      throw new HttpException(
        'Failed to delete backup schedule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Disaster Recovery Planning
   */
  @Get('disaster-recovery/plans')
  @RequireRoles('admin')
  async getDisasterRecoveryPlans(@Request() req: any) {
    try {
      const plans = await this.backupService.getDisasterRecoveryPlans();
      
      return {
        success: true,
        data: plans,
      };
    } catch (error) {
      this.logger.error('Failed to get disaster recovery plans:', error);
      throw new HttpException(
        'Failed to retrieve disaster recovery plans',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('disaster-recovery/plans')
  @RequireRoles('admin')
  async createDisasterRecoveryPlan(
    @Body() plan: Omit<DisasterRecoveryPlan, 'id'>,
    @Request() req: any,
  ) {
    try {
      const createdPlan = await this.backupService.createDisasterRecoveryPlan(
        plan,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} created disaster recovery plan: ${plan.name}`);
      
      return {
        success: true,
        data: createdPlan,
        message: 'Disaster recovery plan created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create disaster recovery plan:', error);
      throw new HttpException(
        'Failed to create disaster recovery plan',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('disaster-recovery/test/:planId')
  @RequireRoles('admin')
  async testDisasterRecoveryPlan(
    @Param('planId') planId: string,
    @Body() testOptions: { dryRun: boolean; environment: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.backupService.testDisasterRecoveryPlan(
        planId,
        testOptions,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} ${testOptions.dryRun ? 'dry-run tested' : 'tested'} disaster recovery plan ${planId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Disaster recovery test completed',
      };
    } catch (error) {
      this.logger.error('Failed to test disaster recovery plan:', error);
      throw new HttpException(
        'Failed to test disaster recovery plan',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Backup Storage Management
   */
  @Get('storage/status')
  @RequireRoles('admin')
  async getStorageStatus(@Request() req: any) {
    try {
      const status = await this.backupService.getStorageStatus();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('Failed to get storage status:', error);
      throw new HttpException(
        'Failed to retrieve storage status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('storage/cleanup')
  @RequireRoles('admin')
  async cleanupOldBackups(
    @Body() options: { olderThanDays: number; dryRun: boolean },
    @Request() req: any,
  ) {
    try {
      const result = await this.backupService.cleanupOldBackups(
        options,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} ${options.dryRun ? 'simulated' : 'performed'} backup cleanup`
      );
      
      return {
        success: true,
        data: result,
        message: options.dryRun ? 'Cleanup simulation completed' : 'Backup cleanup completed',
      };
    } catch (error) {
      this.logger.error('Failed to cleanup backups:', error);
      throw new HttpException(
        'Failed to cleanup backups',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Backup Verification and Integrity
   */
  @Post('verify/:backupId')
  @RequireRoles('admin')
  async verifyBackup(
    @Param('backupId') backupId: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.backupService.verifyBackup(backupId);
      
      this.logger.log(`Admin ${req.user.sub} verified backup ${backupId}`);
      
      return {
        success: true,
        data: result,
        message: 'Backup verification completed',
      };
    } catch (error) {
      this.logger.error(`Failed to verify backup ${backupId}:`, error);
      throw new HttpException(
        'Failed to verify backup',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('integrity/report')
  @RequireRoles('admin')
  async getIntegrityReport(
    @Query('days') days: number = 30,
    @Request() req: any,
  ) {
    try {
      const report = await this.backupService.getIntegrityReport(days);
      
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      this.logger.error('Failed to get integrity report:', error);
      throw new HttpException(
        'Failed to retrieve integrity report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}