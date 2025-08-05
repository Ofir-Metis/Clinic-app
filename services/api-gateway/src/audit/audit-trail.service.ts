import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditEvent } from './entities/audit-event.entity';
import { AuditEventType, AuditCategory, AuditSeverity } from './enums/audit.enums';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { AuditSearchDto } from './dto/audit-search.dto';

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  /**
   * Create a new audit event for HIPAA compliance tracking
   */
  async createAuditEvent(dto: CreateAuditEventDto): Promise<AuditEvent> {
    try {
      const auditEvent = this.auditEventRepository.create({
        ...dto,
        timestamp: new Date(),
        id: this.generateAuditId(),
      });

      const savedEvent = await this.auditEventRepository.save(auditEvent);
      
      // Log critical events immediately
      if (dto.severity === AuditSeverity.CRITICAL || dto.severity === AuditSeverity.HIGH) {
        this.logger.warn(`AUDIT EVENT: ${dto.eventType} - ${dto.description}`, {
          auditId: savedEvent.id,
          userId: dto.userId,
          patientId: dto.patientId,
          ipAddress: dto.ipAddress,
        });
      }

      return savedEvent;
    } catch (error) {
      this.logger.error('Failed to create audit event', error.stack);
      throw error;
    }
  }

  /**
   * Log user authentication events
   */
  async logAuthenticationEvent(
    userId: string,
    eventType: AuditEventType,
    request: Request,
    additionalData?: any,
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      eventType,
      category: AuditCategory.AUTHENTICATION,
      severity: eventType === AuditEventType.LOGIN_FAILED ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      userId,
      userRole: request.user?.role,
      description: this.getAuthEventDescription(eventType),
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      sessionId: request.sessionID,
      resourceType: 'AUTH',
      endpoint: request.path,
      httpMethod: request.method,
      additionalData: {
        ...additionalData,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log patient data access events (HIPAA critical)
   */
  async logPatientDataAccess(
    userId: string,
    patientId: string,
    eventType: AuditEventType,
    request: Request,
    resourceType: string,
    resourceId?: string,
    additionalData?: any,
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      eventType,
      category: AuditCategory.DATA_ACCESS,
      severity: AuditSeverity.HIGH,
      userId,
      patientId,
      userRole: request.user?.role,
      description: `Patient data ${eventType.toLowerCase()} - ${resourceType}`,
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      sessionId: request.sessionID,
      resourceType,
      resourceId,
      endpoint: request.path,
      httpMethod: request.method,
      additionalData: {
        ...additionalData,
        dataTypes: this.extractDataTypes(request),
        accessReason: request.headers['x-access-reason'],
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log administrative actions
   */
  async logAdministrativeAction(
    userId: string,
    eventType: AuditEventType,
    request: Request,
    targetUserId?: string,
    additionalData?: any,
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      eventType,
      category: AuditCategory.ADMINISTRATIVE,
      severity: AuditSeverity.MEDIUM,
      userId,
      targetUserId,
      userRole: request.user?.role,
      description: this.getAdminEventDescription(eventType, targetUserId),
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      sessionId: request.sessionID,
      resourceType: 'ADMIN',
      endpoint: request.path,
      httpMethod: request.method,
      additionalData: {
        ...additionalData,
        adminAction: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log system security events
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    request: Request,
    severity: AuditSeverity = AuditSeverity.HIGH,
    additionalData?: any,
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      eventType,
      category: AuditCategory.SECURITY,
      severity,
      userId: request.user?.id,
      userRole: request.user?.role,
      description: this.getSecurityEventDescription(eventType),
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      sessionId: request.sessionID,
      resourceType: 'SECURITY',
      endpoint: request.path,
      httpMethod: request.method,
      additionalData: {
        ...additionalData,
        securityAlert: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log system events and errors
   */
  async logSystemEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    description: string,
    additionalData?: any,
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      eventType,
      category: AuditCategory.SYSTEM,
      severity,
      description,
      resourceType: 'SYSTEM',
      additionalData: {
        ...additionalData,
        systemEvent: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Search audit events with filters
   */
  async searchAuditEvents(searchDto: AuditSearchDto): Promise<{
    events: AuditEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      startDate,
      endDate,
      userId,
      patientId,
      eventType,
      category,
      severity,
      resourceType,
      ipAddress,
      page = 1,
      limit = 50,
    } = searchDto;

    const queryBuilder = this.auditEventRepository.createQueryBuilder('audit');

    // Date range filter (required for performance)
    if (startDate) {
      queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate });
    }

    // User filters
    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }
    if (patientId) {
      queryBuilder.andWhere('audit.patientId = :patientId', { patientId });
    }

    // Event filters
    if (eventType) {
      queryBuilder.andWhere('audit.eventType = :eventType', { eventType });
    }
    if (category) {
      queryBuilder.andWhere('audit.category = :category', { category });
    }
    if (severity) {
      queryBuilder.andWhere('audit.severity = :severity', { severity });
    }
    if (resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', { resourceType });
    }

    // Network filter
    if (ipAddress) {
      queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('audit.timestamp', 'DESC')
      .skip(offset)
      .take(limit);

    const [events, total] = await queryBuilder.getManyAndCount();

    return {
      events,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit statistics for reporting
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    securityEvents: number;
    patientAccessEvents: number;
  }> {
    const queryBuilder = this.auditEventRepository.createQueryBuilder('audit');
    
    queryBuilder.where('audit.timestamp BETWEEN :startDate AND :endDate', {
      startDate,
      endDate,
    });

    const [totalEvents, eventsByCategory, eventsBySeverity, topUsers] = await Promise.all([
      // Total events
      queryBuilder.getCount(),
      
      // Events by category
      queryBuilder
        .select('audit.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.category')
        .getRawMany(),
        
      // Events by severity
      queryBuilder
        .select('audit.severity', 'severity')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.severity')
        .getRawMany(),
        
      // Top users
      queryBuilder
        .select('audit.userId', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('audit.userId IS NOT NULL')
        .groupBy('audit.userId')
        .orderBy('COUNT(*)', 'DESC')
        .limit(10)
        .getRawMany(),
    ]);

    const securityEvents = await queryBuilder
      .andWhere('audit.category = :category', { category: AuditCategory.SECURITY })
      .getCount();

    const patientAccessEvents = await queryBuilder
      .andWhere('audit.patientId IS NOT NULL')
      .getCount();

    return {
      totalEvents,
      eventsByCategory: this.mapArrayToObject(eventsByCategory, 'category', 'count'),
      eventsBySeverity: this.mapArrayToObject(eventsBySeverity, 'severity', 'count'),
      topUsers: topUsers.map(user => ({ userId: user.userId, count: parseInt(user.count) })),
      securityEvents,
      patientAccessEvents,
    };
  }

  /**
   * Export audit events for compliance reporting
   */
  async exportAuditEvents(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'csv',
  ): Promise<string> {
    const events = await this.auditEventRepository.find({
      where: {
        timestamp: this.createBetweenCondition(startDate, endDate),
      },
      order: {
        timestamp: 'DESC',
      },
    });

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    // CSV format
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Category', 'Severity',
      'User ID', 'User Role', 'Patient ID', 'IP Address',
      'Resource Type', 'Endpoint', 'HTTP Method', 'Description'
    ];

    const csvRows = [
      headers.join(','),
      ...events.map(event => [
        event.id,
        event.timestamp.toISOString(),
        event.eventType,
        event.category,
        event.severity,
        event.userId || '',
        event.userRole || '',
        event.patientId || '',
        event.ipAddress || '',
        event.resourceType || '',
        event.endpoint || '',
        event.httpMethod || '',
        `"${event.description.replace(/"/g, '""')}"`,
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  /**
   * Clean up old audit events based on retention policy
   */
  async cleanupOldAuditEvents(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditEventRepository
      .createQueryBuilder()
      .delete()
      .from(AuditEvent)
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} audit events older than ${retentionDays} days`);
    return result.affected || 0;
  }

  // Private helper methods

  private generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `AUD_${timestamp}_${randomPart}`.toUpperCase();
  }

  private getClientIpAddress(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private getAuthEventDescription(eventType: AuditEventType): string {
    const descriptions = {
      [AuditEventType.LOGIN_SUCCESS]: 'User successfully authenticated',
      [AuditEventType.LOGIN_FAILED]: 'User authentication failed',
      [AuditEventType.LOGOUT]: 'User logged out',
      [AuditEventType.PASSWORD_CHANGED]: 'User password changed',
      [AuditEventType.MFA_ENABLED]: 'Multi-factor authentication enabled',
      [AuditEventType.MFA_DISABLED]: 'Multi-factor authentication disabled',
    };
    return descriptions[eventType] || 'Authentication event';
  }

  private getAdminEventDescription(eventType: AuditEventType, targetUserId?: string): string {
    const target = targetUserId ? ` for user ${targetUserId}` : '';
    const descriptions = {
      [AuditEventType.USER_CREATED]: `User account created${target}`,
      [AuditEventType.USER_UPDATED]: `User account updated${target}`,
      [AuditEventType.USER_DELETED]: `User account deleted${target}`,
      [AuditEventType.ROLE_CHANGED]: `User role changed${target}`,
      [AuditEventType.PERMISSION_GRANTED]: `Permission granted${target}`,
      [AuditEventType.PERMISSION_REVOKED]: `Permission revoked${target}`,
    };
    return descriptions[eventType] || `Administrative action${target}`;
  }

  private getSecurityEventDescription(eventType: AuditEventType): string {
    const descriptions = {
      [AuditEventType.UNAUTHORIZED_ACCESS]: 'Unauthorized access attempt',
      [AuditEventType.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
      [AuditEventType.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [AuditEventType.INVALID_TOKEN]: 'Invalid authentication token',
      [AuditEventType.CSRF_DETECTED]: 'Cross-site request forgery detected',
    };
    return descriptions[eventType] || 'Security event';
  }

  private extractDataTypes(request: Request): string[] {
    const dataTypes = [];
    const path = request.path.toLowerCase();
    
    if (path.includes('patient')) dataTypes.push('patient_data');
    if (path.includes('medical')) dataTypes.push('medical_records');
    if (path.includes('appointment')) dataTypes.push('appointment_data');
    if (path.includes('note')) dataTypes.push('clinical_notes');
    if (path.includes('file') || path.includes('document')) dataTypes.push('documents');
    
    return dataTypes;
  }

  private mapArrayToObject(array: any[], keyField: string, valueField: string): Record<string, number> {
    return array.reduce((acc, item) => {
      acc[item[keyField]] = parseInt(item[valueField]);
      return acc;
    }, {});
  }

  /**
   * Find audit event by ID
   */
  async findAuditEventById(id: string): Promise<AuditEvent> {
    const auditEvent = await this.auditEventRepository.findOne({
      where: { id },
    });

    if (!auditEvent) {
      throw new Error(`Audit event with ID ${id} not found`);
    }

    return auditEvent;
  }

  /**
   * Mark audit event as reviewed
   */
  async markAuditEventAsReviewed(
    id: string,
    reviewedBy: string,
    notes?: string,
  ): Promise<AuditEvent> {
    const auditEvent = await this.findAuditEventById(id);
    
    auditEvent.reviewed = true;
    auditEvent.reviewedBy = reviewedBy;
    auditEvent.reviewedAt = new Date();
    auditEvent.reviewNotes = notes;

    return this.auditEventRepository.save(auditEvent);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    framework: string,
  ): Promise<{
    reportId: string;
    framework: string;
    dateRange: { startDate: string; endDate: string };
    summary: any;
    violations: any[];
    recommendations: string[];
  }> {
    const reportId = `RPT_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    
    const statistics = await this.getAuditStatistics(startDate, endDate);
    const suspiciousEvents = await this.auditEventRepository.find({
      where: {
        timestamp: this.createBetweenCondition(startDate, endDate),
        suspiciousActivity: true,
      },
      order: { timestamp: 'DESC' },
    });

    const violations = suspiciousEvents.map(event => ({
      id: event.id,
      type: event.eventType,
      severity: event.severity,
      description: event.description,
      timestamp: event.timestamp,
      userId: event.userId,
      patientId: event.patientId,
    }));

    const recommendations = this.generateComplianceRecommendations(statistics, violations);

    return {
      reportId,
      framework,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        ...statistics,
        complianceScore: this.calculateComplianceScore(statistics, violations),
        violationsCount: violations.length,
      },
      violations,
      recommendations,
    };
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(days: number): Promise<{
    activities: AuditEvent[];
    patterns: any[];
    recommendations: string[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const activities = await this.auditEventRepository.find({
      where: {
        timestamp: this.createBetweenCondition(startDate, endDate),
        suspiciousActivity: true,
      },
      order: { timestamp: 'DESC' },
      take: 100,
    });

    const patterns = await this.identifyPatterns(activities);
    const recommendations = this.generateSecurityRecommendations(activities, patterns);

    return {
      activities,
      patterns,
      recommendations,
    };
  }

  /**
   * Get user audit timeline
   */
  async getUserAuditTimeline(
    userId: string,
    days: number,
  ): Promise<{
    userId: string;
    events: AuditEvent[];
    summary: any;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const events = await this.auditEventRepository.find({
      where: {
        userId,
        timestamp: this.createBetweenCondition(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
      take: 500,
    });

    const summary = {
      totalEvents: events.length,
      eventsByType: this.groupEventsByField(events, 'eventType'),
      eventsByCategory: this.groupEventsByField(events, 'category'),
      loginAttempts: events.filter(e => e.eventType.includes('LOGIN')).length,
      patientAccesses: events.filter(e => e.patientId).length,
      suspiciousActivities: events.filter(e => e.suspiciousActivity).length,
    };

    return {
      userId,
      events,
      summary,
    };
  }

  /**
   * Get patient access log
   */
  async getPatientAccessLog(
    patientId: string,
    days: number,
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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const accessEvents = await this.auditEventRepository.find({
      where: {
        patientId,
        timestamp: this.createBetweenCondition(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
    });

    const uniqueUsers = [...new Set(accessEvents.map(e => e.userId).filter(Boolean))].length;
    const dataTypes = [...new Set(
      accessEvents.map(e => e.resourceType).filter(Boolean)
    )];
    const emergencyAccesses = accessEvents.filter(
      e => e.hipaaMetadata?.emergencyAccess
    ).length;

    return {
      patientId,
      accessEvents,
      summary: {
        totalAccesses: accessEvents.length,
        uniqueUsers,
        dataTypes,
        emergencyAccesses,
      },
    };
  }

  // Private helper methods for new functionality
  private createBetweenCondition(from: Date, to: Date) {
    return {
      $gte: from,
      $lte: to,
    };
  }

  private generateComplianceRecommendations(statistics: any, violations: any[]): string[] {
    const recommendations = [];

    if (violations.length > 10) {
      recommendations.push('Consider implementing additional security monitoring');
    }

    if (statistics.securityEvents > statistics.totalEvents * 0.1) {
      recommendations.push('High number of security events detected - review access controls');
    }

    if (statistics.patientAccessEvents > statistics.totalEvents * 0.8) {
      recommendations.push('Review patient data access patterns for compliance');
    }

    recommendations.push('Regularly review and update audit retention policies');
    recommendations.push('Ensure all staff complete HIPAA compliance training');

    return recommendations;
  }

  private calculateComplianceScore(statistics: any, violations: any[]): number {
    let score = 100;

    // Deduct points for violations
    score -= violations.length * 2;

    // Deduct points for high security event ratio
    const securityRatio = statistics.securityEvents / statistics.totalEvents;
    if (securityRatio > 0.1) {
      score -= (securityRatio - 0.1) * 100;
    }

    return Math.max(0, Math.min(100, score));
  }

  private async identifyPatterns(activities: AuditEvent[]): Promise<any[]> {
    const patterns = [];

    // IP address patterns
    const ipCounts = this.groupEventsByField(activities, 'ipAddress');
    for (const [ip, count] of Object.entries(ipCounts)) {
      if (count > 10) {
        patterns.push({
          type: 'high_activity_ip',
          value: ip,
          count,
          risk: 'medium',
        });
      }
    }

    // User patterns
    const userCounts = this.groupEventsByField(activities, 'userId');
    for (const [userId, count] of Object.entries(userCounts)) {
      if (count > 20) {
        patterns.push({
          type: 'high_activity_user',
          value: userId,
          count,
          risk: 'low',
        });
      }
    }

    return patterns;
  }

  private generateSecurityRecommendations(activities: AuditEvent[], patterns: any[]): string[] {
    const recommendations = [];

    if (patterns.some(p => p.risk === 'high')) {
      recommendations.push('Immediate investigation required for high-risk patterns');
    }

    if (activities.some(a => a.eventType === AuditEventType.UNAUTHORIZED_ACCESS)) {
      recommendations.push('Review and strengthen access controls');
    }

    if (patterns.some(p => p.type === 'high_activity_ip')) {
      recommendations.push('Consider implementing IP-based rate limiting');
    }

    recommendations.push('Regular security awareness training for staff');
    recommendations.push('Implement additional monitoring for suspicious patterns');

    return recommendations;
  }

  private groupEventsByField(events: AuditEvent[], field: string): Record<string, number> {
    return events.reduce((acc, event) => {
      const value = event[field] as string;
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }
}