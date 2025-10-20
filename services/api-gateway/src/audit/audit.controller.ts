import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@clinic/common';
import { AuditTrailService } from './audit-trail.service';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { AuditSearchDto } from './dto/audit-search.dto';
import { AuditEvent } from './entities/audit-event.entity';
import { UserRole } from '@clinic/common';

@ApiTags('Audit Trail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditTrailService: AuditTrailService) {}

  @Post('events')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new audit event' })
  @ApiResponse({ status: 201, description: 'Audit event created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @HttpCode(HttpStatus.CREATED)
  async createAuditEvent(
    @Body(ValidationPipe) createAuditEventDto: CreateAuditEventDto,
    @CurrentUser() user: any,
  ): Promise<AuditEvent> {
    // Log the creation of this audit event
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_EVENT_CREATED' as any,
      { user, path: '/audit/events', method: 'POST' } as any,
      undefined,
      { manualEvent: true, createdBy: user.id },
    );

    return this.auditTrailService.createAuditEvent(createAuditEventDto);
  }

  @Get('events')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Search audit events with filters' })
  @ApiResponse({ status: 200, description: 'List of audit events' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchAuditEvents(
    @Query(ValidationPipe) searchDto: AuditSearchDto,
    @CurrentUser() user: any,
  ): Promise<{
    events: AuditEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Log audit log access
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_LOG_ACCESSED' as any,
      { user, path: '/audit/events', method: 'GET' } as any,
      undefined,
      {
        searchCriteria: searchDto,
        accessedBy: user.id,
        accessTime: new Date(),
      },
    );

    return this.auditTrailService.searchAuditEvents(searchDto);
  }

  @Get('events/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get a specific audit event by ID' })
  @ApiResponse({ status: 200, description: 'Audit event details' })
  @ApiResponse({ status: 404, description: 'Audit event not found' })
  async getAuditEvent(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<AuditEvent> {
    // Log access to specific audit event
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_EVENT_ACCESSED' as any,
      { user, path: `/audit/events/${id}`, method: 'GET' } as any,
      undefined,
      { auditEventId: id, accessedBy: user.id },
    );

    // Note: You'll need to implement this method in the service
    return this.auditTrailService.findAuditEventById(id);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get audit statistics for reporting' })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getAuditStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    securityEvents: number;
    patientAccessEvents: number;
  }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Log statistics access
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_STATISTICS_ACCESSED' as any,
      { user, path: '/audit/statistics', method: 'GET' } as any,
      undefined,
      {
        dateRange: { startDate: start, endDate: end },
        accessedBy: user.id,
      },
    );

    return this.auditTrailService.getAuditStatistics(start, end);
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Export audit events for compliance reporting' })
  @ApiResponse({ status: 200, description: 'Audit events exported successfully' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], type: String })
  async exportAuditEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Log export action
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_LOG_EXPORTED' as any,
      { user, path: '/audit/export', method: 'GET' } as any,
      undefined,
      {
        exportFormat: format,
        dateRange: { startDate: start, endDate: end },
        exportedBy: user.id,
        exportTime: new Date(),
      },
    );

    const exportData = await this.auditTrailService.exportAuditEvents(start, end, format);

    // Set appropriate headers
    const filename = `audit-export-${startDate}-${endDate}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    response.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(Buffer.from(exportData));
  }

  @Post('events/:id/review')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Mark an audit event as reviewed' })
  @ApiResponse({ status: 200, description: 'Audit event marked as reviewed' })
  @HttpCode(HttpStatus.OK)
  async reviewAuditEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    // Log the review action
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_EVENT_REVIEWED' as any,
      { user, path: `/audit/events/${id}/review`, method: 'POST' } as any,
      undefined,
      {
        auditEventId: id,
        reviewNotes: notes,
        reviewedBy: user.id,
        reviewTime: new Date(),
      },
    );

    // Update the audit event (you'll need to implement this method)
    await this.auditTrailService.markAuditEventAsReviewed(id, user.id, notes);

    return { message: 'Audit event marked as reviewed successfully' };
  }

  @Get('compliance-report')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Generate HIPAA compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'framework', required: false, enum: ['HIPAA', 'GDPR', 'SOX'] })
  async generateComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('framework') framework: string = 'HIPAA',
    @CurrentUser() user: any,
  ): Promise<{
    reportId: string;
    framework: string;
    dateRange: { startDate: string; endDate: string };
    summary: any;
    violations: any[];
    recommendations: string[];
  }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Log compliance report generation
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'COMPLIANCE_REPORT_GENERATED' as any,
      { user, path: '/audit/compliance-report', method: 'GET' } as any,
      undefined,
      {
        framework,
        dateRange: { startDate: start, endDate: end },
        generatedBy: user.id,
        generationTime: new Date(),
      },
    );

    // Generate the compliance report (you'll need to implement this method)
    return this.auditTrailService.generateComplianceReport(start, end, framework);
  }

  @Get('suspicious-activities')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SECURITY_OFFICER)
  @ApiOperation({ summary: 'Get suspicious activities for security review' })
  @ApiResponse({ status: 200, description: 'List of suspicious activities' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back' })
  async getSuspiciousActivities(
    @Query('days') days: number = 7,
    @CurrentUser() user: any,
  ): Promise<{
    activities: AuditEvent[];
    patterns: any[];
    recommendations: string[];
  }> {
    // Log security review access
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'SECURITY_REVIEW_ACCESSED' as any,
      { user, path: '/audit/suspicious-activities', method: 'GET' } as any,
      undefined,
      {
        lookbackDays: days,
        accessedBy: user.id,
        securityReview: true,
      },
    );

    // Get suspicious activities (you'll need to implement this method)
    return this.auditTrailService.getSuspiciousActivities(days);
  }

  @Post('cleanup')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clean up old audit events based on retention policy' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  @ApiQuery({ name: 'retentionDays', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  async cleanupAuditEvents(
    @Query('retentionDays') retentionDays: number = 2555, // 7 years default for HIPAA
    @CurrentUser() user: any,
  ): Promise<{ message: string; deletedCount: number }> {
    // Log cleanup action
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'AUDIT_CLEANUP_INITIATED' as any,
      { user, path: '/audit/cleanup', method: 'POST' } as any,
      undefined,
      {
        retentionDays,
        initiatedBy: user.id,
        cleanupTime: new Date(),
      },
    );

    const deletedCount = await this.auditTrailService.cleanupOldAuditEvents(retentionDays);

    return {
      message: `Successfully cleaned up ${deletedCount} old audit events`,
      deletedCount,
    };
  }

  @Get('user/:userId/timeline')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get audit timeline for a specific user' })
  @ApiResponse({ status: 200, description: 'User audit timeline' })
  async getUserAuditTimeline(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: any,
  ): Promise<{
    userId: string;
    events: AuditEvent[];
    summary: any;
  }> {
    // Log user timeline access
    await this.auditTrailService.logAdministrativeAction(
      user.id,
      'USER_AUDIT_TIMELINE_ACCESSED' as any,
      { user, path: `/audit/user/${userId}/timeline`, method: 'GET' } as any,
      userId,
      {
        targetUserId: userId,
        timelineDays: days,
        accessedBy: user.id,
      },
    );

    // Get user audit timeline (you'll need to implement this method)
    return this.auditTrailService.getUserAuditTimeline(userId, days);
  }

  @Get('patient/:patientId/access-log')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get patient data access log for HIPAA compliance' })
  @ApiResponse({ status: 200, description: 'Patient access log' })
  async getPatientAccessLog(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('days') days: number = 90,
    @CurrentUser() user: any,
  ): Promise<{
    patientId: string;
    accessEvents: AuditEvent[];
    summary: {
      totalAccesses: number;
      uniqueUsers: number;
      dataTypes: string[];
      emergencyAccesses: number;
    };
  }> {
    // Log patient access log review
    await this.auditTrailService.logPatientDataAccess(
      user.id,
      patientId,
      'PATIENT_ACCESS_LOG_REVIEWED' as any,
      { user, path: `/audit/patient/${patientId}/access-log`, method: 'GET' } as any,
      'ACCESS_LOG',
      undefined,
      {
        reviewDays: days,
        reviewedBy: user.id,
        hipaaCompliance: true,
      },
    );

    // Get patient access log (you'll need to implement this method)
    return this.auditTrailService.getPatientAccessLog(patientId, days);
  }
}