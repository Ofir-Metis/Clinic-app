/**
 * ComplianceController - Comprehensive audit trails and compliance reporting
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
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common/auth/jwt-auth.guard';
import { ComplianceService } from './compliance.service';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceType: 'user' | 'patient' | 'appointment' | 'file' | 'system' | 'configuration';
  outcome: 'success' | 'failure' | 'warning';
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: string[];
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted' | 'phi';
}

export interface ComplianceReport {
  id: string;
  type: 'hipaa' | 'gdpr' | 'soc2' | 'iso27001' | 'custom';
  title: string;
  description: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  sections: ComplianceSection[];
  summary: {
    totalEvents: number;
    complianceScore: number;
    criticalFindings: number;
    recommendations: string[];
  };
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

export interface ComplianceSection {
  id: string;
  title: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  score: number;
  evidence: Array<{
    type: 'log' | 'configuration' | 'policy' | 'documentation';
    description: string;
    reference: string;
  }>;
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    remediation?: string;
  }>;
  controls: Array<{
    id: string;
    name: string;
    implemented: boolean;
    effectiveness: 'effective' | 'partially_effective' | 'ineffective';
  }>;
}

export interface DataAccessRequest {
  id: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  subjectId: string;
  subjectEmail: string;
  subjectType: 'patient' | 'user' | 'employee';
  requestedAt: Date;
  requestedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  legalBasis?: string;
  dataCategories: string[];
  responseDeadline: Date;
  assignedTo?: string;
  resolution?: {
    completedAt: Date;
    completedBy: string;
    action: string;
    notes: string;
    attachments?: string[];
  };
}

export interface RiskAssessment {
  id: string;
  title: string;
  description: string;
  category: 'data_protection' | 'security' | 'operational' | 'financial' | 'regulatory';
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';
  owner: string;
  assessedAt: Date;
  assessedBy: string;
  mitigationControls: Array<{
    id: string;
    description: string;
    implemented: boolean;
    effectiveness: number;
  }>;
  reviewDate: Date;
}

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  private readonly logger = new Logger(ComplianceController.name);

  constructor(private complianceService: ComplianceService) {}

  /**
   * Get compliance overview and dashboard
   */
  @Get('overview')
  @RequireRoles('admin', 'compliance_officer')
  async getComplianceOverview(@Request() req: any) {
    try {
      const overview = await this.complianceService.getComplianceOverview();
      
      this.logger.log(`User ${req.user.sub} viewed compliance overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get compliance overview:', error);
      throw new HttpException(
        'Failed to retrieve compliance overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Audit Trail Management
   */
  @Get('audit/events')
  @RequireRoles('admin', 'compliance_officer', 'auditor')
  async getAuditEvents(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('outcome') outcome?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ) {
    try {
      const events = await this.complianceService.getAuditEvents({
        startDate,
        endDate,
        userId,
        action,
        resource,
        outcome,
        riskLevel,
        limit,
        offset,
      });
      
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger.error('Failed to get audit events:', error);
      throw new HttpException(
        'Failed to retrieve audit events',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('audit/events')
  @RequireRoles('admin', 'system')
  async createAuditEvent(
    @Body() event: Omit<AuditEvent, 'id' | 'timestamp'>,
    @Request() req: any,
    @Headers() headers: any,
  ) {
    try {
      const createdEvent = await this.complianceService.createAuditEvent({
        ...event,
        userId: event.userId || req.user.sub,
        ipAddress: event.ipAddress || req.ip || headers['x-forwarded-for'] || 'unknown',
        userAgent: event.userAgent || headers['user-agent'] || 'unknown',
        sessionId: event.sessionId || req.sessionID || 'unknown',
      });
      
      return {
        success: true,
        data: createdEvent,
        message: 'Audit event recorded successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create audit event:', error);
      throw new HttpException(
        'Failed to record audit event',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('audit/events/:eventId')
  @RequireRoles('admin', 'compliance_officer', 'auditor')
  async getAuditEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    try {
      const event = await this.complianceService.getAuditEvent(eventId);
      
      return {
        success: true,
        data: event,
      };
    } catch (error) {
      this.logger.error(`Failed to get audit event ${eventId}:`, error);
      throw new HttpException(
        'Failed to retrieve audit event',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Compliance Reporting
   */
  @Get('reports')
  @RequireRoles('admin', 'compliance_officer')
  async getComplianceReports(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      const reports = await this.complianceService.getComplianceReports({
        type,
        status,
      });
      
      return {
        success: true,
        data: reports,
      };
    } catch (error) {
      this.logger.error('Failed to get compliance reports:', error);
      throw new HttpException(
        'Failed to retrieve compliance reports',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reports/generate')
  @RequireRoles('admin', 'compliance_officer')
  async generateComplianceReport(
    @Body() reportRequest: {
      type: 'hipaa' | 'gdpr' | 'soc2' | 'iso27001' | 'custom';
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      includeSections?: string[];
      customCriteria?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      const report = await this.complianceService.generateComplianceReport(
        reportRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} generated ${reportRequest.type} compliance report`
      );
      
      return {
        success: true,
        data: report,
        message: 'Compliance report generation initiated',
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw new HttpException(
        'Failed to generate compliance report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reports/:reportId')
  @RequireRoles('admin', 'compliance_officer', 'auditor')
  async getComplianceReport(
    @Param('reportId') reportId: string,
    @Request() req: any,
  ) {
    try {
      const report = await this.complianceService.getComplianceReport(reportId);
      
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      this.logger.error(`Failed to get compliance report ${reportId}:`, error);
      throw new HttpException(
        'Failed to retrieve compliance report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reports/:reportId/download')
  @RequireRoles('admin', 'compliance_officer', 'auditor')
  async downloadComplianceReport(
    @Param('reportId') reportId: string,
    @Query('format') format: 'pdf' | 'xlsx' | 'csv' = 'pdf',
    @Request() req: any,
  ) {
    try {
      const reportFile = await this.complianceService.downloadComplianceReport(
        reportId,
        format
      );
      
      this.logger.log(
        `User ${req.user.sub} downloaded compliance report ${reportId} as ${format}`
      );
      
      return {
        success: true,
        data: reportFile,
        message: 'Report download prepared',
      };
    } catch (error) {
      this.logger.error('Failed to download compliance report:', error);
      throw new HttpException(
        'Failed to download compliance report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Data Subject Rights (GDPR)
   */
  @Get('data-rights/requests')
  @RequireRoles('admin', 'compliance_officer', 'privacy_officer')
  async getDataAccessRequests(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Request() req: any,
  ) {
    try {
      const requests = await this.complianceService.getDataAccessRequests({
        status,
        type,
        priority,
      });
      
      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      this.logger.error('Failed to get data access requests:', error);
      throw new HttpException(
        'Failed to retrieve data access requests',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('data-rights/requests')
  @RequireRoles('admin', 'compliance_officer', 'privacy_officer')
  async createDataAccessRequest(
    @Body() request: Omit<DataAccessRequest, 'id' | 'requestedAt' | 'status'>,
    @Request() req: any,
  ) {
    try {
      const createdRequest = await this.complianceService.createDataAccessRequest(
        request,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created data access request for ${request.subjectEmail}`
      );
      
      return {
        success: true,
        data: createdRequest,
        message: 'Data access request created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create data access request:', error);
      throw new HttpException(
        'Failed to create data access request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('data-rights/requests/:requestId')
  @RequireRoles('admin', 'compliance_officer', 'privacy_officer')
  async updateDataAccessRequest(
    @Param('requestId') requestId: string,
    @Body() update: Partial<DataAccessRequest>,
    @Request() req: any,
  ) {
    try {
      const updatedRequest = await this.complianceService.updateDataAccessRequest(
        requestId,
        update,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} updated data access request ${requestId}`
      );
      
      return {
        success: true,
        data: updatedRequest,
        message: 'Data access request updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update data access request:', error);
      throw new HttpException(
        'Failed to update data access request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('data-rights/requests/:requestId/fulfill')
  @RequireRoles('admin', 'compliance_officer', 'privacy_officer')
  async fulfillDataAccessRequest(
    @Param('requestId') requestId: string,
    @Body() fulfillment: {
      action: string;
      notes: string;
      attachments?: string[];
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.complianceService.fulfillDataAccessRequest(
        requestId,
        fulfillment,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} fulfilled data access request ${requestId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Data access request fulfilled successfully',
      };
    } catch (error) {
      this.logger.error('Failed to fulfill data access request:', error);
      throw new HttpException(
        'Failed to fulfill data access request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Risk Assessment and Management
   */
  @Get('risk/assessments')
  @RequireRoles('admin', 'compliance_officer', 'risk_manager')
  async getRiskAssessments(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('owner') owner?: string,
    @Request() req: any,
  ) {
    try {
      const assessments = await this.complianceService.getRiskAssessments({
        category,
        status,
        owner,
      });
      
      return {
        success: true,
        data: assessments,
      };
    } catch (error) {
      this.logger.error('Failed to get risk assessments:', error);
      throw new HttpException(
        'Failed to retrieve risk assessments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('risk/assessments')
  @RequireRoles('admin', 'compliance_officer', 'risk_manager')
  async createRiskAssessment(
    @Body() assessment: Omit<RiskAssessment, 'id' | 'assessedAt' | 'riskScore'>,
    @Request() req: any,
  ) {
    try {
      const createdAssessment = await this.complianceService.createRiskAssessment(
        assessment,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created risk assessment: ${assessment.title}`
      );
      
      return {
        success: true,
        data: createdAssessment,
        message: 'Risk assessment created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create risk assessment:', error);
      throw new HttpException(
        'Failed to create risk assessment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('risk/assessments/:assessmentId')
  @RequireRoles('admin', 'compliance_officer', 'risk_manager')
  async updateRiskAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() update: Partial<RiskAssessment>,
    @Request() req: any,
  ) {
    try {
      const updatedAssessment = await this.complianceService.updateRiskAssessment(
        assessmentId,
        update,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} updated risk assessment ${assessmentId}`
      );
      
      return {
        success: true,
        data: updatedAssessment,
        message: 'Risk assessment updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update risk assessment:', error);
      throw new HttpException(
        'Failed to update risk assessment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Compliance Analytics and Metrics
   */
  @Get('analytics/metrics')
  @RequireRoles('admin', 'compliance_officer')
  async getComplianceMetrics(
    @Query('period') period: string = '30d',
    @Query('type') type?: string,
    @Request() req: any,
  ) {
    try {
      const metrics = await this.complianceService.getComplianceMetrics(period, type);
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Failed to get compliance metrics:', error);
      throw new HttpException(
        'Failed to retrieve compliance metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics/trends')
  @RequireRoles('admin', 'compliance_officer')
  async getComplianceTrends(
    @Query('metric') metric: string,
    @Query('period') period: string = '90d',
    @Request() req: any,
  ) {
    try {
      const trends = await this.complianceService.getComplianceTrends(metric, period);
      
      return {
        success: true,
        data: trends,
      };
    } catch (error) {
      this.logger.error('Failed to get compliance trends:', error);
      throw new HttpException(
        'Failed to retrieve compliance trends',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Policy and Controls Management
   */
  @Get('policies')
  @RequireRoles('admin', 'compliance_officer')
  async getPolicies(@Request() req: any) {
    try {
      const policies = await this.complianceService.getPolicies();
      
      return {
        success: true,
        data: policies,
      };
    } catch (error) {
      this.logger.error('Failed to get policies:', error);
      throw new HttpException(
        'Failed to retrieve policies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('controls/effectiveness')
  @RequireRoles('admin', 'compliance_officer')
  async getControlEffectiveness(@Request() req: any) {
    try {
      const effectiveness = await this.complianceService.getControlEffectiveness();
      
      return {
        success: true,
        data: effectiveness,
      };
    } catch (error) {
      this.logger.error('Failed to get control effectiveness:', error);
      throw new HttpException(
        'Failed to retrieve control effectiveness',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Incident and Breach Management
   */
  @Post('incidents/data-breach')
  @RequireRoles('admin', 'compliance_officer', 'security_officer')
  async reportDataBreach(
    @Body() breach: {
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      affectedRecords: number;
      dataTypes: string[];
      discoveredAt: Date;
      containedAt?: Date;
      rootCause?: string;
      impactAssessment: string;
    },
    @Request() req: any,
  ) {
    try {
      const incident = await this.complianceService.reportDataBreach(
        breach,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} reported data breach: ${breach.title}`
      );
      
      return {
        success: true,
        data: incident,
        message: 'Data breach incident reported successfully',
      };
    } catch (error) {
      this.logger.error('Failed to report data breach:', error);
      throw new HttpException(
        'Failed to report data breach',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('incidents/breaches')
  @RequireRoles('admin', 'compliance_officer', 'security_officer')
  async getDataBreaches(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Request() req: any,
  ) {
    try {
      const breaches = await this.complianceService.getDataBreaches({
        status,
        severity,
      });
      
      return {
        success: true,
        data: breaches,
      };
    } catch (error) {
      this.logger.error('Failed to get data breaches:', error);
      throw new HttpException(
        'Failed to retrieve data breaches',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}