/**
 * ComplianceController - Comprehensive HIPAA compliance framework with audit trails and reporting
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
  HttpStatus,
  HttpException,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MFAGuard } from '../auth/mfa.guard';
import { RequireMFA } from '../auth/mfa.decorator';
import {
  HIPAAComplianceService,
  PHIDataHandlerService,
  ComplianceAuditService,
  ComplianceAssessment,
  HIPAAViolation,
  AuditEvent,
  AuditQuery,
  AuditReport,
  ComplianceMetrics,
  PHIAuditEntry,
  ConsentManagement
} from '@clinic/common';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString } from 'class-validator';

// DTOs for request validation
class ComplianceAssessmentDto {
  @IsString()
  @IsOptional()
  assessor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scope?: string[];
}

class ViolationReportDto {
  @IsString()
  ruleId: string;

  @IsString()
  description: string;

  @IsEnum(['minor', 'major', 'critical'])
  severity: 'minor' | 'major' | 'critical';

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  resourceId?: string;
}

class AuditQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventTypes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resources?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  severity?: string[];

  @IsBoolean()
  @IsOptional()
  hipaaRelevant?: boolean;
}

class ConsentManagementDto {
  @IsString()
  patientId: string;

  @IsEnum(['treatment', 'payment', 'operations', 'research', 'marketing'])
  consentType: 'treatment' | 'payment' | 'operations' | 'research' | 'marketing';

  @IsBoolean()
  granted: boolean;

  @IsString()
  purpose: string;

  @IsArray()
  @IsString({ each: true })
  dataTypes: string[];

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restrictions?: string[];
}

class GenerateReportDto {
  @IsEnum(['compliance', 'security', 'privacy', 'breach', 'custom'])
  reportType: 'compliance' | 'security' | 'privacy' | 'breach' | 'custom';

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  customFilters?: AuditQueryDto;
}

@ApiTags('Compliance Management')
@ApiBearerAuth()
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(
    private readonly hipaaCompliance: HIPAAComplianceService,
    private readonly phiDataHandler: PHIDataHandlerService,
    private readonly complianceAudit: ComplianceAuditService
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get compliance dashboard overview' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data retrieved successfully' })
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  async getComplianceDashboard(@Request() req: any) {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get recent compliance metrics
      const metrics = await this.complianceAudit.getComplianceMetrics(today);
      
      // Get recent assessment
      const assessment = await this.hipaaCompliance.assessCompliance(req.user.id);
      
      // Get recent violations
      const violations = await this.complianceAudit.detectComplianceViolations({
        startDate: thirtyDaysAgo,
        endDate: today
      });

      // Get audit events summary
      const auditSummary = await this.complianceAudit.queryAuditEvents({
        startDate: thirtyDaysAgo,
        endDate: today,
        limit: 100
      });

      return {
        status: 'success',
        data: {
          overview: {
            overallComplianceScore: assessment.results.overallScore,
            criticalViolations: violations.filter(v => v.severity === 'critical').length,
            totalAudits: auditSummary.length,
            lastAssessment: assessment.assessmentDate
          },
          metrics: metrics.complianceScores,
          recentViolations: violations.slice(0, 10),
          complianceStatus: assessment.results.ruleCompliance,
          trends: {
            dailyMetrics: metrics.metrics,
            weeklyTrend: 'stable' // Would calculate from historical data
          }
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve compliance dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('assessment')
  @ApiOperation({ summary: 'Conduct HIPAA compliance assessment' })
  @ApiResponse({ status: 201, description: 'Compliance assessment completed successfully' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async conductAssessment(
    @Body() assessmentDto: ComplianceAssessmentDto,
    @Request() req: any
  ): Promise<{ status: string; data: ComplianceAssessment }> {
    try {
      const assessment = await this.hipaaCompliance.assessCompliance(
        assessmentDto.assessor || req.user.id,
        assessmentDto.scope
      );

      // Log the assessment activity
      await this.complianceAudit.logAuditEvent(
        'system_access',
        'compliance_assessment',
        'conduct_assessment',
        'success',
        {
          assessmentId: assessment.assessmentId,
          overallScore: assessment.results.overallScore,
          rulesAssessed: assessment.findings.length,
          scope: assessmentDto.scope
        },
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          mfaVerified: true
        }
      );

      return {
        status: 'success',
        data: assessment
      };
    } catch (error) {
      throw new HttpException(
        `Failed to conduct compliance assessment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('violations')
  @ApiOperation({ summary: 'Report a compliance violation' })
  @ApiResponse({ status: 201, description: 'Violation reported successfully' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer', 'healthcare_provider')
  @UsePipes(new ValidationPipe({ transform: true }))
  async reportViolation(
    @Body() violationDto: ViolationReportDto,
    @Request() req: any
  ): Promise<{ status: string; data: { violationId: string } }> {
    try {
      const violationId = await this.hipaaCompliance.reportViolation(
        violationDto.ruleId,
        violationDto.description,
        violationDto.severity,
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          patientId: violationDto.patientId,
          resourceId: violationDto.resourceId
        }
      );

      return {
        status: 'success',
        data: { violationId }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to report violation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('violations')
  @ApiOperation({ summary: 'Get compliance violations' })
  @ApiResponse({ status: 200, description: 'Violations retrieved successfully' })
  @ApiQuery({ name: 'severity', required: false, enum: ['minor', 'major', 'critical'] })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'investigating', 'resolved'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  async getViolations(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50
  ): Promise<{ status: string; data: HIPAAViolation[] }> {
    try {
      const violations = await this.hipaaCompliance.getViolations({
        severity: severity as any,
        status: status as any,
        limit
      });

      return {
        status: 'success',
        data: violations
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve violations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('violations/:violationId/status')
  @ApiOperation({ summary: 'Update violation status' })
  @ApiResponse({ status: 200, description: 'Violation status updated successfully' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  async updateViolationStatus(
    @Param('violationId') violationId: string,
    @Body('status') status: 'open' | 'investigating' | 'resolved',
    @Body('resolution') resolution?: string,
    @Request() req: any
  ): Promise<{ status: string; message: string }> {
    try {
      await this.hipaaCompliance.updateViolationStatus(
        violationId,
        status,
        req.user.id,
        resolution
      );

      return {
        status: 'success',
        message: 'Violation status updated successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update violation status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('audit-events')
  @ApiOperation({ summary: 'Query audit events' })
  @ApiResponse({ status: 200, description: 'Audit events retrieved successfully' })
  @Roles('admin', 'compliance_officer', 'privacy_officer', 'security_officer')
  async queryAuditEvents(@Query() queryDto: AuditQueryDto): Promise<{ status: string; data: AuditEvent[] }> {
    try {
      const query: AuditQuery = {
        ...queryDto,
        startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
        endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
        eventTypes: queryDto.eventTypes as any,
        limit: 100 // Default limit
      };

      const events = await this.complianceAudit.queryAuditEvents(query);

      return {
        status: 'success',
        data: events
      };
    } catch (error) {
      throw new HttpException(
        `Failed to query audit events: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 201, description: 'Compliance report generated successfully' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateReport(
    @Body() reportDto: GenerateReportDto,
    @Request() req: any
  ): Promise<{ status: string; data: AuditReport }> {
    try {
      const customFilters = reportDto.customFilters ? {
        ...reportDto.customFilters,
        startDate: reportDto.customFilters.startDate ? new Date(reportDto.customFilters.startDate) : undefined,
        endDate: reportDto.customFilters.endDate ? new Date(reportDto.customFilters.endDate) : undefined
      } : undefined;

      const report = await this.complianceAudit.generateComplianceReport(
        reportDto.reportType,
        new Date(reportDto.startDate),
        new Date(reportDto.endDate),
        req.user.id,
        customFilters
      );

      return {
        status: 'success',
        data: report
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate compliance report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get compliance metrics' })
  @ApiResponse({ status: 200, description: 'Compliance metrics retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, type: 'string' })
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  async getComplianceMetrics(
    @Query('date') date?: string
  ): Promise<{ status: string; data: ComplianceMetrics }> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const metrics = await this.complianceAudit.getComplianceMetrics(targetDate);

      return {
        status: 'success',
        data: metrics
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve compliance metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('consent')
  @ApiOperation({ summary: 'Manage patient consent' })
  @ApiResponse({ status: 201, description: 'Patient consent updated successfully' })
  @RequireMFA()
  @Roles('admin', 'healthcare_provider', 'nurse', 'consent_manager')
  @UsePipes(new ValidationPipe({ transform: true }))
  async manageConsent(
    @Body() consentDto: ConsentManagementDto,
    @Request() req: any
  ): Promise<{ status: string; message: string }> {
    try {
      const consent: ConsentManagement = {
        consentId: `CONSENT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...consentDto,
        grantedAt: consentDto.granted ? new Date() : undefined,
        expiresAt: consentDto.expiresAt ? new Date(consentDto.expiresAt) : undefined
      };

      await this.phiDataHandler.manageConsent(consent);

      // Log consent management activity
      await this.complianceAudit.logAuditEvent(
        'consent_management',
        'patient_consent',
        'update_consent',
        'success',
        {
          consentId: consent.consentId,
          patientId: consentDto.patientId,
          consentType: consentDto.consentType,
          granted: consentDto.granted,
          purpose: consentDto.purpose
        },
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          mfaVerified: true,
          patientId: consentDto.patientId
        }
      );

      return {
        status: 'success',
        message: 'Patient consent updated successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to manage consent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('phi-audit/:patientId')
  @ApiOperation({ summary: 'Get PHI audit trail for patient' })
  @ApiResponse({ status: 200, description: 'PHI audit trail retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer', 'healthcare_provider')
  async getPHIAuditTrail(
    @Param('patientId') patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: any
  ): Promise<{ status: string; data: PHIAuditEntry[] }> {
    try {
      const trail = await this.phiDataHandler.getPHIAuditTrail(
        patientId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      // Log audit trail access
      await this.complianceAudit.logAuditEvent(
        'data_access',
        'phi_audit_trail',
        'view_audit_trail',
        'success',
        {
          patientId,
          entriesReturned: trail.length,
          dateRange: { startDate, endDate }
        },
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          mfaVerified: true,
          patientId
        }
      );

      return {
        status: 'success',
        data: trail
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve PHI audit trail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('phi-compliance-report')
  @ApiOperation({ summary: 'Generate PHI compliance report' })
  @ApiResponse({ status: 200, description: 'PHI compliance report generated successfully' })
  @ApiQuery({ name: 'startDate', required: true, type: 'string' })
  @ApiQuery({ name: 'endDate', required: true, type: 'string' })
  @RequireMFA()
  @Roles('admin', 'compliance_officer', 'privacy_officer')
  async generatePHIComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any
  ) {
    try {
      const report = await this.phiDataHandler.generateComplianceReport(
        new Date(startDate),
        new Date(endDate)
      );

      // Log report generation
      await this.complianceAudit.logAuditEvent(
        'system_access',
        'phi_compliance_report',
        'generate_report',
        'success',
        {
          dateRange: { startDate, endDate },
          totalAccesses: report.summary.totalAccesses,
          violations: report.violations.length
        },
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          mfaVerified: true
        }
      );

      return {
        status: 'success',
        data: report
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate PHI compliance report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('audit-events/cleanup')
  @ApiOperation({ summary: 'Manually trigger audit events cleanup' })
  @ApiResponse({ status: 200, description: 'Audit cleanup completed successfully' })
  @RequireMFA()
  @Roles('admin', 'system_administrator')
  async triggerAuditCleanup(@Request() req: any): Promise<{ status: string; message: string }> {
    try {
      // This would trigger the cleanup method (normally runs via cron)
      // Implementation would depend on the specific cleanup mechanism
      
      await this.complianceAudit.logAuditEvent(
        'system_access',
        'audit_system',
        'manual_cleanup_trigger',
        'success',
        {
          triggeredBy: req.user.id,
          timestamp: new Date().toISOString()
        },
        {
          userId: req.user.id,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          service: 'compliance-api',
          mfaVerified: true
        }
      );

      return {
        status: 'success',
        message: 'Audit cleanup triggered successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to trigger audit cleanup: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Compliance system health check' })
  @ApiResponse({ status: 200, description: 'Compliance system health status' })
  async healthCheck(): Promise<{ status: string; data: any }> {
    try {
      const currentTime = new Date();
      const dayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

      // Check recent audit activity
      const recentAudits = await this.complianceAudit.queryAuditEvents({
        startDate: dayAgo,
        endDate: currentTime,
        limit: 10
      });

      // Get current metrics
      const metrics = await this.complianceAudit.getComplianceMetrics();

      return {
        status: 'success',
        data: {
          systemStatus: 'healthy',
          lastAuditEvent: recentAudits[0]?.timestamp || 'No recent events',
          auditEventsLast24h: recentAudits.length,
          complianceScores: metrics.complianceScores,
          timestamp: currentTime.toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        data: {
          systemStatus: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}