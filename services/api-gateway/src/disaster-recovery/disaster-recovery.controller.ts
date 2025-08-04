import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequireMFA } from '../auth/mfa.decorator';
import {
  DisasterRecoveryService,
  BusinessContinuityService,
  BackupMetadata,
  BusinessImpactAnalysis,
  ContinuityStrategy,
  TestResult
} from '@clinic/common';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, IsDateString } from 'class-validator';

// DTOs for disaster recovery operations
class CreateBackupDto {
  @IsString()
  @IsOptional()
  triggeredBy?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  includeFiles?: boolean;

  @IsBoolean()
  @IsOptional()
  includeDatabases?: boolean;

  @IsBoolean()
  @IsOptional()
  includeConfigs?: boolean;
}

class RestoreBackupDto {
  @IsString()
  backupId: string;

  @IsDateString()
  @IsOptional()
  restorePoint?: string;

  @IsBoolean()
  @IsOptional()
  includeDatabases?: boolean;

  @IsBoolean()
  @IsOptional()
  includeFiles?: boolean;

  @IsBoolean()
  @IsOptional()
  includeConfigs?: boolean;

  @IsString()
  @IsOptional()
  targetLocation?: string;

  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

class InitiateFailoverDto {
  @IsString()
  reason: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @IsBoolean()
  @IsOptional()
  skipHealthChecks?: boolean;

  @IsString()
  @IsOptional()
  targetSite?: string;
}

class BusinessImpactAnalysisDto {
  @IsString()
  processName: string;

  @IsString()
  department: string;

  @IsString()
  processOwner: string;

  @IsString()
  description: string;

  @IsNumber()
  hourlyRevenue: number;

  @IsNumber()
  patientsServed: number;

  @IsArray()
  @IsString({ each: true })
  dependencies: string[];

  @IsArray()
  @IsString({ each: true })
  regulations: string[];
}

class ContinuityStrategyDto {
  @IsArray()
  @IsString({ each: true })
  processIds: string[];

  @IsNumber()
  budget: number;

  @IsNumber()
  timeframe: number;

  @IsEnum(['low', 'medium', 'high'])
  riskTolerance: 'low' | 'medium' | 'high';

  @IsArray()
  @IsString({ each: true })
  priorities: string[];
}

class ActivatePlanDto {
  @IsString()
  incidentType: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @IsArray()
  @IsString({ each: true })
  affectedProcesses: string[];

  @IsString()
  description: string;
}

class ExecuteTestDto {
  @IsString()
  testId: string;

  @IsArray()
  @IsString({ each: true })
  participants: string[];
}

@ApiTags('Disaster Recovery & Business Continuity')
@ApiBearerAuth()
@Controller('disaster-recovery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisasterRecoveryController {
  constructor(
    private readonly disasterRecoveryService: DisasterRecoveryService,
    private readonly businessContinuityService: BusinessContinuityService
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get disaster recovery status' })
  @ApiResponse({ status: 200, description: 'DR status retrieved successfully' })
  @Roles('admin', 'disaster_recovery_manager', 'compliance_officer')
  async getDisasterRecoveryStatus(@Request() req: any) {
    try {
      const drStatus = await this.disasterRecoveryService.getDisasterRecoveryStatus();
      const bcpStatus = await this.businessContinuityService.getBusinessContinuityStatus();

      return {
        status: 'success',
        data: {
          disasterRecovery: drStatus,
          businessContinuity: bcpStatus,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve DR status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('backup/full')
  @ApiOperation({ summary: 'Create full system backup' })
  @ApiResponse({ status: 201, description: 'Full backup created successfully' })
  @RequireMFA()
  @Roles('admin', 'disaster_recovery_manager', 'backup_operator')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createFullBackup(
    @Body() createBackupDto: CreateBackupDto,
    @Request() req: any
  ): Promise<{ status: string; data: BackupMetadata }> {
    try {
      const backup = await this.disasterRecoveryService.createFullBackup({
        triggeredBy: createBackupDto.triggeredBy || req.user.id,
        reason: createBackupDto.reason || 'Manual backup request',
        includeFiles: createBackupDto.includeFiles,
        includeDatabases: createBackupDto.includeDatabases,
        includeConfigs: createBackupDto.includeConfigs
      });

      return {
        status: 'success',
        data: backup
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create full backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('backup/incremental')
  @ApiOperation({ summary: 'Create incremental backup' })
  @ApiResponse({ status: 201, description: 'Incremental backup created successfully' })
  @RequireMFA()
  @Roles('admin', 'disaster_recovery_manager', 'backup_operator')
  async createIncrementalBackup(
    @Body('lastBackupId') lastBackupId: string,
    @Body('reason') reason: string,
    @Request() req: any
  ): Promise<{ status: string; data: BackupMetadata }> {
    try {
      const backup = await this.disasterRecoveryService.createIncrementalBackup(
        lastBackupId,
        {
          triggeredBy: req.user.id,
          reason: reason || 'Manual incremental backup'
        }
      );

      return {
        status: 'success',
        data: backup
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create incremental backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiResponse({ status: 200, description: 'Restore operation completed' })
  @RequireMFA()
  @Roles('admin', 'disaster_recovery_manager')
  @UsePipes(new ValidationPipe({ transform: true }))
  async restoreFromBackup(
    @Body() restoreDto: RestoreBackupDto,
    @Request() req: any
  ) {
    try {
      const result = await this.disasterRecoveryService.restoreFromBackup(
        restoreDto.backupId,
        {
          restorePoint: restoreDto.restorePoint ? new Date(restoreDto.restorePoint) : undefined,
          includeDatabases: restoreDto.includeDatabases,
          includeFiles: restoreDto.includeFiles,
          includeConfigs: restoreDto.includeConfigs,
          targetLocation: restoreDto.targetLocation,
          dryRun: restoreDto.dryRun
        }
      );

      return {
        status: 'success',
        data: result,
        message: `Restore ${result.success ? 'completed successfully' : 'completed with errors'}`
      };
    } catch (error) {
      throw new HttpException(
        `Failed to restore from backup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('failover')
  @ApiOperation({ summary: 'Initiate failover to secondary site' })
  @ApiResponse({ status: 200, description: 'Failover initiated successfully' })
  @RequireMFA()
  @Roles('admin', 'disaster_recovery_manager')
  @UsePipes(new ValidationPipe({ transform: true }))
  async initiateFailover(
    @Body() failoverDto: InitiateFailoverDto,
    @Request() req: any
  ) {
    try {
      const result = await this.disasterRecoveryService.initiateFailover(
        failoverDto.reason,
        req.user.id,
        {
          force: failoverDto.force,
          skipHealthChecks: failoverDto.skipHealthChecks,
          targetSite: failoverDto.targetSite
        }
      );

      return {
        status: 'success',
        data: result,
        message: `Failover ${result.success ? 'completed successfully' : 'completed with errors'}`
      };
    } catch (error) {
      throw new HttpException(
        `Failed to initiate failover: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('backups')
  @ApiOperation({ summary: 'List recent backups' })
  @ApiResponse({ status: 200, description: 'Backups list retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'type', required: false, enum: ['full', 'incremental', 'differential'] })
  @Roles('admin', 'disaster_recovery_manager', 'backup_operator')
  async getBackups(
    @Query('limit') limit: number = 20,
    @Query('type') type?: string
  ) {
    try {
      const status = await this.disasterRecoveryService.getDisasterRecoveryStatus();
      let backups = status.recentBackups;

      if (type) {
        backups = backups.filter(backup => backup.type === type);
      }

      backups = backups.slice(0, limit);

      return {
        status: 'success',
        data: {
          backups,
          total: backups.length
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve backups: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('business-impact-analysis')
  @ApiOperation({ summary: 'Conduct business impact analysis' })
  @ApiResponse({ status: 201, description: 'BIA completed successfully' })
  @RequireMFA()
  @Roles('admin', 'business_continuity_manager', 'compliance_officer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async conductBusinessImpactAnalysis(
    @Body() biaDto: BusinessImpactAnalysisDto,
    @Request() req: any
  ): Promise<{ status: string; data: BusinessImpactAnalysis }> {
    try {
      const bia = await this.businessContinuityService.conductBusinessImpactAnalysis(
        {
          name: biaDto.processName,
          department: biaDto.department,
          owner: biaDto.processOwner,
          description: biaDto.description
        },
        {
          hourlyRevenue: biaDto.hourlyRevenue,
          patientsServed: biaDto.patientsServed,
          dependencies: biaDto.dependencies,
          regulations: biaDto.regulations
        }
      );

      return {
        status: 'success',
        data: bia
      };
    } catch (error) {
      throw new HttpException(
        `Failed to conduct BIA: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('continuity-strategy')
  @ApiOperation({ summary: 'Develop continuity strategy' })
  @ApiResponse({ status: 201, description: 'Continuity strategy developed successfully' })
  @RequireMFA()
  @Roles('admin', 'business_continuity_manager')
  @UsePipes(new ValidationPipe({ transform: true }))
  async developContinuityStrategy(
    @Body() strategyDto: ContinuityStrategyDto,
    @Request() req: any
  ): Promise<{ status: string; data: ContinuityStrategy }> {
    try {
      const strategy = await this.businessContinuityService.developContinuityStrategy(
        strategyDto.processIds,
        {
          budget: strategyDto.budget,
          timeframe: strategyDto.timeframe,
          riskTolerance: strategyDto.riskTolerance,
          priorities: strategyDto.priorities
        }
      );

      return {
        status: 'success',
        data: strategy
      };
    } catch (error) {
      throw new HttpException(
        `Failed to develop continuity strategy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('activate-plan')
  @ApiOperation({ summary: 'Activate business continuity plan' })
  @ApiResponse({ status: 200, description: 'Continuity plan activated successfully' })
  @RequireMFA()
  @Roles('admin', 'business_continuity_manager', 'incident_commander')
  @UsePipes(new ValidationPipe({ transform: true }))
  async activateContinuityPlan(
    @Body() activateDto: ActivatePlanDto,
    @Request() req: any
  ) {
    try {
      const result = await this.businessContinuityService.activateContinuityPlan(
        activateDto.incidentType,
        activateDto.severity,
        activateDto.affectedProcesses,
        req.user.id,
        activateDto.description
      );

      return {
        status: 'success',
        data: result,
        message: 'Business continuity plan activated successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to activate continuity plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test/execute')
  @ApiOperation({ summary: 'Execute continuity test' })
  @ApiResponse({ status: 200, description: 'Continuity test executed successfully' })
  @RequireMFA()
  @Roles('admin', 'business_continuity_manager', 'test_coordinator')
  @UsePipes(new ValidationPipe({ transform: true }))
  async executeContinuityTest(
    @Body() testDto: ExecuteTestDto,
    @Request() req: any
  ): Promise<{ status: string; data: TestResult }> {
    try {
      const result = await this.businessContinuityService.executeContinuityTest(
        testDto.testId,
        testDto.participants,
        req.user.id
      );

      return {
        status: 'success',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        `Failed to execute continuity test: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('test/results')
  @ApiOperation({ summary: 'Get test results' })
  @ApiResponse({ status: 200, description: 'Test results retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @Roles('admin', 'business_continuity_manager', 'compliance_officer')
  async getTestResults(
    @Query('limit') limit: number = 10
  ) {
    try {
      const status = await this.businessContinuityService.getBusinessContinuityStatus();
      const testResults = status.recentTests.slice(0, limit);

      return {
        status: 'success',
        data: {
          testResults,
          upcomingTests: status.upcomingTests,
          total: testResults.length
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve test results: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Disaster recovery health check' })
  @ApiResponse({ status: 200, description: 'DR health status retrieved' })
  @Roles('admin', 'disaster_recovery_manager', 'system_administrator')
  async healthCheck() {
    try {
      const drStatus = await this.disasterRecoveryService.getDisasterRecoveryStatus();
      const bcpStatus = await this.businessContinuityService.getBusinessContinuityStatus();

      const overallHealth = this.calculateOverallHealth(drStatus, bcpStatus);

      return {
        status: 'success',
        data: {
          overall: overallHealth,
          disasterRecovery: {
            backupHealth: drStatus.healthStatus.backupHealth,
            replicationHealth: drStatus.healthStatus.replicationHealth,
            rpoCompliance: drStatus.healthStatus.rpoCompliance,
            rtoCompliance: drStatus.healthStatus.rtoCompliance
          },
          businessContinuity: {
            planCompleteness: bcpStatus.planStatus.completeness,
            trainingStatus: bcpStatus.trainingStatus.completionRate,
            complianceScore: bcpStatus.complianceStatus.complianceScore
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to check DR health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get disaster recovery metrics' })
  @ApiResponse({ status: 200, description: 'DR metrics retrieved successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ['24h', '7d', '30d', '90d'] })
  @Roles('admin', 'disaster_recovery_manager', 'compliance_officer')
  async getDisasterRecoveryMetrics(
    @Query('period') period: string = '30d'
  ) {
    try {
      const drStatus = await this.disasterRecoveryService.getDisasterRecoveryStatus();
      const bcpStatus = await this.businessContinuityService.getBusinessContinuityStatus();

      const metrics = {
        recovery: {
          rpo: drStatus.config.rpo,
          rto: drStatus.config.rto,
          lastBackup: drStatus.recentBackups[0]?.timestamp,
          backupCount: drStatus.recentBackups.length,
          failoverStatus: drStatus.failoverStatus
        },
        businessContinuity: {
          activeIncidents: bcpStatus.activeIncidents.length,
          criticalProcesses: bcpStatus.riskSummary.criticalProcesses,
          complianceScore: bcpStatus.complianceStatus.complianceScore,
          trainingCompletionRate: bcpStatus.trainingStatus.completionRate
        },
        testing: {
          recentTests: bcpStatus.recentTests.length,
          averageTestScore: this.calculateAverageTestScore(bcpStatus.recentTests),
          upcomingTests: bcpStatus.upcomingTests.length
        }
      };

      return {
        status: 'success',
        data: {
          metrics,
          period,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve DR metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('compliance-report')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated successfully' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'pdf', 'csv'] })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'disaster_recovery_manager')
  async generateComplianceReport(
    @Query('format') format: string = 'json',
    @Request() req: any
  ) {
    try {
      const drStatus = await this.disasterRecoveryService.getDisasterRecoveryStatus();
      const bcpStatus = await this.businessContinuityService.getBusinessContinuityStatus();

      const report = {
        reportId: `DR-COMPLIANCE-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.id,
        period: {
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        summary: {
          overallComplianceScore: this.calculateComplianceScore(drStatus, bcpStatus),
          rpoCompliance: drStatus.healthStatus.rpoCompliance,
          rtoCompliance: drStatus.healthStatus.rtoCompliance,
          backupCompliance: this.calculateBackupCompliance(drStatus),
          testingCompliance: this.calculateTestingCompliance(bcpStatus)
        },
        findings: this.generateComplianceFindings(drStatus, bcpStatus),
        recommendations: this.generateRecommendations(drStatus, bcpStatus)
      };

      return {
        status: 'success',
        data: report,
        format
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate compliance report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Private helper methods

  private calculateOverallHealth(drStatus: any, bcpStatus: any): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check DR health
    if (drStatus.healthStatus.overall === 'critical') {
      score -= 40;
      issues.push('Critical disaster recovery issues detected');
    } else if (drStatus.healthStatus.overall === 'warning') {
      score -= 20;
      issues.push('Disaster recovery warnings detected');
    }

    // Check BCP health
    if (bcpStatus.planStatus.completeness < 80) {
      score -= 20;
      issues.push('Business continuity plan incomplete');
    }

    if (bcpStatus.trainingStatus.completionRate < 90) {
      score -= 10;
      issues.push('Training completion rate below target');
    }

    const status = score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'critical';

    return { status, score, issues };
  }

  private calculateAverageTestScore(testResults: TestResult[]): number {
    if (testResults.length === 0) return 0;
    const totalScore = testResults.reduce((sum, test) => sum + test.overallRating, 0);
    return Math.round(totalScore / testResults.length);
  }

  private calculateComplianceScore(drStatus: any, bcpStatus: any): number {
    const weights = {
      rpoCompliance: 0.25,
      rtoCompliance: 0.25,
      backupHealth: 0.20,
      planCompleteness: 0.15,
      trainingCompliance: 0.15
    };

    const scores = {
      rpoCompliance: drStatus.healthStatus.rpoCompliance ? 100 : 0,
      rtoCompliance: drStatus.healthStatus.rtoCompliance ? 100 : 0,
      backupHealth: drStatus.healthStatus.backupHealth === 'healthy' ? 100 : 
                   drStatus.healthStatus.backupHealth === 'warning' ? 70 : 0,
      planCompleteness: bcpStatus.planStatus.completeness,
      trainingCompliance: bcpStatus.trainingStatus.completionRate
    };

    return Math.round(
      Object.entries(weights).reduce((total, [key, weight]) => 
        total + (scores[key] * weight), 0
      )
    );
  }

  private calculateBackupCompliance(drStatus: any): number {
    const lastBackup = drStatus.recentBackups[0];
    if (!lastBackup) return 0;

    const timeSinceBackup = Date.now() - new Date(lastBackup.timestamp).getTime();
    const rpoMs = drStatus.config.rpo * 60 * 1000;

    return timeSinceBackup <= rpoMs ? 100 : Math.max(0, 100 - (timeSinceBackup / rpoMs * 100));
  }

  private calculateTestingCompliance(bcpStatus: any): number {
    const recentTests = bcpStatus.recentTests;
    if (recentTests.length === 0) return 0;

    const lastTest = recentTests[0];
    const daysSinceTest = (Date.now() - new Date(lastTest.executionDate).getTime()) / (24 * 60 * 60 * 1000);
    
    return daysSinceTest <= 180 ? 100 : Math.max(0, 100 - (daysSinceTest - 180) / 180 * 100);
  }

  private generateComplianceFindings(drStatus: any, bcpStatus: any): string[] {
    const findings: string[] = [];

    if (!drStatus.healthStatus.rpoCompliance) {
      findings.push('RPO objectives not being met');
    }

    if (!drStatus.healthStatus.rtoCompliance) {
      findings.push('RTO objectives not being met');
    }

    if (bcpStatus.planStatus.completeness < 100) {
      findings.push('Business continuity plan incomplete');
    }

    if (bcpStatus.activeIncidents.length > 0) {
      findings.push(`${bcpStatus.activeIncidents.length} active incidents requiring attention`);
    }

    return findings;
  }

  private generateRecommendations(drStatus: any, bcpStatus: any): string[] {
    const recommendations: string[] = [];

    if (drStatus.healthStatus.overall !== 'healthy') {
      recommendations.push('Address disaster recovery health issues');
    }

    if (bcpStatus.trainingStatus.completionRate < 90) {
      recommendations.push('Improve training completion rates');
    }

    if (bcpStatus.upcomingTests.length === 0) {
      recommendations.push('Schedule regular continuity testing');
    }

    recommendations.push('Conduct regular DR/BCP reviews and updates');
    recommendations.push('Implement automated monitoring and alerting');

    return recommendations;
  }
}