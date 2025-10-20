import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface AuditEvent {
  eventId: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
  hipaaRelevant: boolean;
  retentionDate: Date;
  complianceFrameworks: string[]; // ['HIPAA', 'SOC2', 'GDPR', etc.]
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization' 
  | 'data_access'
  | 'data_modification'
  | 'data_export'
  | 'system_access'
  | 'configuration_change'
  | 'security_event'
  | 'privacy_event'
  | 'consent_management'
  | 'breach_incident'
  | 'policy_violation';

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  userIds?: string[];
  resources?: string[];
  severity?: string[];
  outcome?: string[];
  hipaaRelevant?: boolean;
  complianceFramework?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  reportId: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'compliance' | 'security' | 'privacy' | 'breach' | 'custom';
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<string, number>;
    uniqueUsers: number;
    failedEvents: number;
    securityIncidents: number;
    privacyEvents: number;
  };
  findings: AuditFinding[];
  recommendations: string[];
  complianceStatus: {
    framework: string;
    overallScore: number;
    violations: number;
    gaps: string[];
  }[];
}

export interface AuditFinding {
  findingId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'privacy' | 'compliance' | 'operational';
  title: string;
  description: string;
  evidence: string[];
  riskLevel: number; // 1-10 scale
  remediation: {
    required: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actions: string[];
    timeline: string;
    responsible: string[];
  };
  relatedEvents: string[]; // Event IDs
  complianceImpact: string[];
}

export interface ComplianceMetrics {
  date: Date;
  metrics: {
    totalAuditEvents: number;
    criticalEvents: number;
    failedAuthentications: number;
    unauthorizedAccess: number;
    dataBreaches: number;
    privacyViolations: number;
    consentViolations: number;
    systemDowntime: number;
    averageResponseTime: number;
    mfaCompliance: number;
    encryptionCompliance: number;
    backupSuccess: number;
  };
  complianceScores: {
    hipaa: number;
    soc2: number;
    gdpr: number;
    iso27001: number;
  };
}

@Injectable()
export class ComplianceAuditService {
  private readonly logger = new Logger(ComplianceAuditService.name);
  private readonly auditEvents: AuditEvent[] = [];
  private readonly complianceMetrics: ComplianceMetrics[] = [];
  private readonly maxRetentionDays: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    this.maxRetentionDays = this.configService.get<number>('AUDIT_RETENTION_DAYS', 2555); // 7 years
  }

  /**
   * Log audit event with compliance tracking
   */
  async logAuditEvent(
    eventType: AuditEventType,
    resource: string,
    action: string,
    outcome: 'success' | 'failure' | 'warning',
    details: Record<string, any>,
    context?: HealthcareLogContext
  ): Promise<string> {
    const eventId = this.generateEventId();
    const severity = this.determineSeverity(eventType, outcome, details);
    const hipaaRelevant = this.isHIPAARelevant(eventType, resource, details);
    
    const auditEvent: AuditEvent = {
      eventId,
      timestamp: new Date(),
      eventType,
      severity,
      userId: context?.userId,
      sessionId: context?.sessionId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      resource,
      action,
      outcome,
      details: this.sanitizeDetails(details),
      hipaaRelevant,
      retentionDate: new Date(Date.now() + this.maxRetentionDays * 24 * 60 * 60 * 1000),
      complianceFrameworks: this.getApplicableFrameworks(eventType, resource, hipaaRelevant)
    };

    this.auditEvents.push(auditEvent);

    // Log to centralized logging system
    await this.centralizedLogger.auditLog(`Audit event: ${eventType}`, {
      eventId,
      eventType,
      resource,
      action,
      outcome: outcome as 'success' | 'timeout' | 'failure',
      severity,
      hipaaRelevant,
      ...context,
      service: 'compliance-audit',
      auditRequired: true,
      retentionYears: Math.ceil(this.maxRetentionDays / 365)
    });

    // Trigger alerts for critical events
    if (severity === 'critical') {
      await this.triggerCriticalEventAlert(auditEvent);
    }

    // Check for compliance violations
    await this.checkComplianceViolations(auditEvent);

    return eventId;
  }

  /**
   * Query audit events with filtering
   */
  async queryAuditEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let events = [...this.auditEvents];

    // Apply filters
    if (query.startDate) {
      events = events.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      events = events.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      events = events.filter(e => query.eventTypes!.includes(e.eventType));
    }

    if (query.userIds && query.userIds.length > 0) {
      events = events.filter(e => e.userId && query.userIds!.includes(e.userId));
    }

    if (query.resources && query.resources.length > 0) {
      events = events.filter(e => query.resources!.some(r => e.resource.includes(r)));
    }

    if (query.severity && query.severity.length > 0) {
      events = events.filter(e => query.severity!.includes(e.severity));
    }

    if (query.outcome && query.outcome.length > 0) {
      events = events.filter(e => query.outcome!.includes(e.outcome));
    }

    if (query.hipaaRelevant !== undefined) {
      events = events.filter(e => e.hipaaRelevant === query.hipaaRelevant);
    }

    if (query.complianceFramework) {
      events = events.filter(e => e.complianceFrameworks.includes(query.complianceFramework!));
    }

    // Sort by timestamp (most recent first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return events.slice(offset, offset + limit);
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    reportType: 'compliance' | 'security' | 'privacy' | 'breach' | 'custom',
    startDate: Date,
    endDate: Date,
    generatedBy: string,
    customFilters?: AuditQuery
  ): Promise<AuditReport> {
    const reportId = `AUDIT-RPT-${Date.now()}`;
    
    // Get events for the time period
    const query: AuditQuery = {
      startDate,
      endDate,
      ...customFilters
    };
    
    const events = await this.queryAuditEvents(query);

    // Calculate summary statistics
    const summary = this.calculateReportSummary(events);
    const findings = await this.analyzeFindings(events, reportType);
    const recommendations = this.generateRecommendations(findings, reportType);
    const complianceStatus = await this.assessComplianceStatus(events);

    const report: AuditReport = {
      reportId,
      generatedAt: new Date(),
      generatedBy,
      reportType,
      timeRange: { startDate, endDate },
      summary,
      findings,
      recommendations,
      complianceStatus
    };

    // Log report generation
    await this.logAuditEvent(
      'system_access',
      'compliance_report',
      'generate_report',
      'success',
      {
        reportId,
        reportType,
        eventCount: events.length,
        findingsCount: findings.length
      },
      { userId: generatedBy, service: 'compliance-audit' }
    );

    return report;
  }

  /**
   * Get compliance metrics for dashboard
   */
  async getComplianceMetrics(date?: Date): Promise<ComplianceMetrics> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayEvents = await this.queryAuditEvents({
      startDate: startOfDay,
      endDate: endOfDay
    });

    const metrics: ComplianceMetrics = {
      date: targetDate,
      metrics: {
        totalAuditEvents: dayEvents.length,
        criticalEvents: dayEvents.filter(e => e.severity === 'critical').length,
        failedAuthentications: dayEvents.filter(e => 
          e.eventType === 'authentication' && e.outcome === 'failure'
        ).length,
        unauthorizedAccess: dayEvents.filter(e => 
          e.eventType === 'authorization' && e.outcome === 'failure'
        ).length,
        dataBreaches: dayEvents.filter(e => e.eventType === 'breach_incident').length,
        privacyViolations: dayEvents.filter(e => e.eventType === 'privacy_event').length,
        consentViolations: dayEvents.filter(e => 
          e.eventType === 'consent_management' && e.outcome === 'failure'
        ).length,
        systemDowntime: 0, // Would be calculated from system events
        averageResponseTime: 0, // Would be calculated from performance events
        mfaCompliance: this.calculateMFACompliance(dayEvents),
        encryptionCompliance: this.calculateEncryptionCompliance(dayEvents),
        backupSuccess: this.calculateBackupSuccess(dayEvents)
      },
      complianceScores: {
        hipaa: await this.calculateHIPAAScore(dayEvents),
        soc2: await this.calculateSOC2Score(dayEvents),
        gdpr: await this.calculateGDPRScore(dayEvents),
        iso27001: await this.calculateISO27001Score(dayEvents)
      }
    };

    this.complianceMetrics.push(metrics);
    return metrics;
  }

  /**
   * Search for potential compliance violations
   */
  async detectComplianceViolations(
    timeRange: { startDate: Date; endDate: Date }
  ): Promise<AuditFinding[]> {
    const events = await this.queryAuditEvents(timeRange);
    const violations: AuditFinding[] = [];

    // Detect repeated failed authentication attempts
    const failedAuthsByUser = this.groupEventsByUser(
      events.filter(e => e.eventType === 'authentication' && e.outcome === 'failure')
    );

    Object.entries(failedAuthsByUser).forEach(([userId, userEvents]) => {
      if (userEvents.length >= 5) { // 5 or more failed attempts
        violations.push({
          findingId: `AUTH-VIOLATION-${userId}-${Date.now()}`,
          severity: 'high',
          category: 'security',
          title: 'Excessive Failed Authentication Attempts',
          description: `User ${userId} has ${userEvents.length} failed authentication attempts`,
          evidence: userEvents.map(e => e.eventId),
          riskLevel: 8,
          remediation: {
            required: true,
            priority: 'high',
            actions: ['Lock account', 'Investigate source', 'Review access logs'],
            timeline: '24 hours',
            responsible: ['Security Team', 'IT Administrator']
          },
          relatedEvents: userEvents.map(e => e.eventId),
          complianceImpact: ['HIPAA Technical Safeguards', 'SOC2 CC6.1']
        });
      }
    });

    // Detect unauthorized PHI access attempts
    const unauthorizedPHIAccess = events.filter(e =>
      e.eventType === 'data_access' &&
      e.outcome === 'failure' &&
      e.hipaaRelevant &&
      e.details.resource?.includes('phi')
    );

    if (unauthorizedPHIAccess.length > 0) {
      violations.push({
        findingId: `PHI-VIOLATION-${Date.now()}`,
        severity: 'critical',
        category: 'privacy',
        title: 'Unauthorized PHI Access Attempts',
        description: `${unauthorizedPHIAccess.length} unauthorized attempts to access PHI`,
        evidence: unauthorizedPHIAccess.map(e => e.eventId),
        riskLevel: 10,
        remediation: {
          required: true,
          priority: 'critical',
          actions: ['Immediate investigation', 'Notify Privacy Officer', 'Review access controls'],
          timeline: '4 hours',
          responsible: ['Privacy Officer', 'Security Team', 'Compliance Officer']
        },
        relatedEvents: unauthorizedPHIAccess.map(e => e.eventId),
        complianceImpact: ['HIPAA Privacy Rule', 'HIPAA Security Rule']
      });
    }

    // Detect missing MFA for sensitive operations
    const sensitiveWithoutMFA = events.filter(e =>
      ['data_modification', 'data_export', 'configuration_change'].includes(e.eventType) &&
      e.outcome === 'success' &&
      !e.details.mfaVerified &&
      e.hipaaRelevant
    );

    if (sensitiveWithoutMFA.length > 0) {
      violations.push({
        findingId: `MFA-VIOLATION-${Date.now()}`,
        severity: 'medium',
        category: 'security',
        title: 'Sensitive Operations Without MFA',
        description: `${sensitiveWithoutMFA.length} sensitive operations performed without MFA`,
        evidence: sensitiveWithoutMFA.map(e => e.eventId),
        riskLevel: 6,
        remediation: {
          required: true,
          priority: 'medium',
          actions: ['Enforce MFA policy', 'Review user access', 'Update security controls'],
          timeline: '1 week',
          responsible: ['IT Administrator', 'Security Team']
        },
        relatedEvents: sensitiveWithoutMFA.map(e => e.eventId),
        complianceImpact: ['HIPAA Technical Safeguards']
      });
    }

    return violations;
  }

  /**
   * Automated cleanup of old audit records (HIPAA: 7 years retention)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  private async cleanupOldAuditRecords(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.maxRetentionDays * 24 * 60 * 60 * 1000);
    const initialCount = this.auditEvents.length;
    
    // Remove expired events
    const expiredEvents = this.auditEvents.filter(event => event.retentionDate < cutoffDate);
    this.auditEvents.splice(0, this.auditEvents.length, 
      ...this.auditEvents.filter(event => event.retentionDate >= cutoffDate)
    );

    const cleanedUp = initialCount - this.auditEvents.length;

    if (cleanedUp > 0) {
      await this.logAuditEvent(
        'system_access',
        'audit_system',
        'cleanup_old_records',
        'success',
        {
          recordsCleaned: cleanedUp,
          retentionDays: this.maxRetentionDays,
          cutoffDate: cutoffDate.toISOString()
        }
      );
    }

    // Archive expired events (in production, move to long-term storage)
    for (const event of expiredEvents) {
      await this.archiveAuditEvent(event);
    }
  }

  /**
   * Generate daily compliance metrics
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  private async generateDailyMetrics(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const metrics = await this.getComplianceMetrics(yesterday);
    
    await this.logAuditEvent(
      'system_access',
      'compliance_metrics',
      'generate_daily_metrics',
      'success',
      {
        date: yesterday.toISOString(),
        totalEvents: metrics.metrics.totalAuditEvents,
        criticalEvents: metrics.metrics.criticalEvents,
        hipaaScore: metrics.complianceScores.hipaa
      }
    );
  }

  // Private helper methods

  private generateEventId(): string {
    return `AUD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private determineSeverity(
    eventType: AuditEventType,
    outcome: string,
    details: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical events
    if (eventType === 'breach_incident') return 'critical';
    if (eventType === 'data_export' && outcome === 'failure') return 'critical';
    if (details.unauthorizedAccess) return 'critical';

    // High severity events
    if (eventType === 'security_event') return 'high';
    if (eventType === 'privacy_event') return 'high';
    if (eventType === 'authentication' && outcome === 'failure' && details.attemptCount > 3) return 'high';

    // Medium severity events
    if (eventType === 'authorization' && outcome === 'failure') return 'medium';
    if (eventType === 'configuration_change') return 'medium';

    // Default to low
    return 'low';
  }

  private isHIPAARelevant(
    eventType: AuditEventType,
    resource: string,
    details: Record<string, any>
  ): boolean {
    const hipaaRelevantTypes: AuditEventType[] = [
      'data_access',
      'data_modification',
      'data_export',
      'privacy_event',
      'consent_management',
      'breach_incident'
    ];

    const hipaaRelevantResources = [
      'patient', 'phi', 'medical_record', 'appointment', 'billing'
    ];

    return hipaaRelevantTypes.includes(eventType) ||
           hipaaRelevantResources.some(r => resource.toLowerCase().includes(r)) ||
           details.hipaaRelevant === true;
  }

  private getApplicableFrameworks(
    eventType: AuditEventType,
    resource: string,
    hipaaRelevant: boolean
  ): string[] {
    const frameworks: string[] = [];

    if (hipaaRelevant) frameworks.push('HIPAA');
    
    // SOC2 applies to all security and operational events
    if (['security_event', 'system_access', 'configuration_change'].includes(eventType)) {
      frameworks.push('SOC2');
    }

    // ISO27001 applies to information security events
    if (['security_event', 'data_access', 'authentication', 'authorization'].includes(eventType)) {
      frameworks.push('ISO27001');
    }

    return frameworks;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private async triggerCriticalEventAlert(event: AuditEvent): Promise<void> {
    this.centralizedLogger.securityLog('Critical audit event detected', {
      eventId: event.eventId,
      eventType: event.eventType,
      resource: event.resource,
      action: event.action,
      userId: event.userId,
      service: 'compliance-audit',
      alertLevel: 'critical',
      requiresImmediateAttention: true
    });
  }

  private async checkComplianceViolations(event: AuditEvent): Promise<void> {
    // Check for immediate compliance violations
    if (event.eventType === 'data_access' && event.outcome === 'failure' && event.hipaaRelevant) {
      await this.logAuditEvent(
        'policy_violation',
        'hipaa_compliance',
        'unauthorized_phi_access',
        'warning',
        {
          originalEventId: event.eventId,
          violationType: 'unauthorized_access',
          complianceFramework: 'HIPAA'
        }
      );
    }
  }

  private calculateReportSummary(events: AuditEvent[]): AuditReport['summary'] {
    const eventsByType: Record<AuditEventType, number> = {} as any;
    const eventsBySeverity: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Track unique users
      if (event.userId) uniqueUsers.add(event.userId);
    });

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      uniqueUsers: uniqueUsers.size,
      failedEvents: events.filter(e => e.outcome === 'failure').length,
      securityIncidents: events.filter(e => e.eventType === 'security_event').length,
      privacyEvents: events.filter(e => e.eventType === 'privacy_event').length
    };
  }

  private async analyzeFindings(events: AuditEvent[], reportType: string): Promise<AuditFinding[]> {
    // This would implement sophisticated analysis based on report type
    return await this.detectComplianceViolations({
      startDate: new Date(Math.min(...events.map(e => e.timestamp.getTime()))),
      endDate: new Date(Math.max(...events.map(e => e.timestamp.getTime())))
    });
  }

  private generateRecommendations(findings: AuditFinding[], reportType: string): string[] {
    const recommendations: string[] = [];

    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push(`Address ${criticalFindings.length} critical security findings immediately`);
    }

    if (highFindings.length > 0) {
      recommendations.push(`Prioritize resolution of ${highFindings.length} high-severity findings`);
    }

    recommendations.push('Implement continuous compliance monitoring');
    recommendations.push('Conduct regular security awareness training');
    recommendations.push('Review and update security policies quarterly');

    return recommendations;
  }

  private async assessComplianceStatus(events: AuditEvent[]): Promise<AuditReport['complianceStatus']> {
    return [
      {
        framework: 'HIPAA',
        overallScore: await this.calculateHIPAAScore(events),
        violations: events.filter(e => e.hipaaRelevant && e.outcome === 'failure').length,
        gaps: ['MFA enforcement', 'Audit log monitoring']
      },
      {
        framework: 'SOC2',
        overallScore: await this.calculateSOC2Score(events),
        violations: events.filter(e => e.complianceFrameworks.includes('SOC2') && e.outcome === 'failure').length,
        gaps: ['Availability monitoring', 'Change management']
      }
    ];
  }

  private groupEventsByUser(events: AuditEvent[]): Record<string, AuditEvent[]> {
    return events.reduce((groups, event) => {
      const userId = event.userId || 'unknown';
      if (!groups[userId]) groups[userId] = [];
      groups[userId].push(event);
      return groups;
    }, {} as Record<string, AuditEvent[]>);
  }

  private calculateMFACompliance(events: AuditEvent[]): number {
    const mfaRequiredEvents = events.filter(e => 
      ['data_modification', 'data_export', 'configuration_change'].includes(e.eventType)
    );
    
    if (mfaRequiredEvents.length === 0) return 100;
    
    const mfaCompliantEvents = mfaRequiredEvents.filter(e => e.details.mfaVerified);
    return Math.round((mfaCompliantEvents.length / mfaRequiredEvents.length) * 100);
  }

  private calculateEncryptionCompliance(events: AuditEvent[]): number {
    const encryptionRequiredEvents = events.filter(e => 
      e.eventType === 'data_access' && e.hipaaRelevant
    );
    
    if (encryptionRequiredEvents.length === 0) return 100;
    
    const encryptedEvents = encryptionRequiredEvents.filter(e => e.details.encrypted);
    return Math.round((encryptedEvents.length / encryptionRequiredEvents.length) * 100);
  }

  private calculateBackupSuccess(events: AuditEvent[]): number {
    const backupEvents = events.filter(e => e.resource.includes('backup'));
    if (backupEvents.length === 0) return 100;
    
    const successfulBackups = backupEvents.filter(e => e.outcome === 'success');
    return Math.round((successfulBackups.length / backupEvents.length) * 100);
  }

  private async calculateHIPAAScore(events: AuditEvent[]): Promise<number> {
    const hipaaEvents = events.filter(e => e.hipaaRelevant);
    if (hipaaEvents.length === 0) return 100;
    
    const violations = hipaaEvents.filter(e => e.outcome === 'failure').length;
    const score = Math.max(0, 100 - (violations / hipaaEvents.length) * 100);
    return Math.round(score);
  }

  private async calculateSOC2Score(events: AuditEvent[]): Promise<number> {
    const soc2Events = events.filter(e => e.complianceFrameworks.includes('SOC2'));
    if (soc2Events.length === 0) return 100;
    
    const violations = soc2Events.filter(e => e.outcome === 'failure').length;
    const score = Math.max(0, 100 - (violations / soc2Events.length) * 100);
    return Math.round(score);
  }

  private async calculateGDPRScore(events: AuditEvent[]): Promise<number> {
    // Simplified GDPR scoring
    return 85; // Placeholder
  }

  private async calculateISO27001Score(events: AuditEvent[]): Promise<number> {
    // Simplified ISO27001 scoring
    return 82; // Placeholder
  }

  private async archiveAuditEvent(event: AuditEvent): Promise<void> {
    // In production, this would move the event to long-term archival storage
    this.logger.log(`Archiving audit event: ${event.eventId}`);
  }
}