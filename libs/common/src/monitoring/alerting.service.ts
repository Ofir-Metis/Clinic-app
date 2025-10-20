import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'performance' | 'business' | 'system' | 'compliance';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'contains' | 'not_contains';
    threshold: number | string;
    window: string; // e.g., '5m', '1h', '1d'
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  };
  enabled: boolean;
  cooldown: string; // e.g., '30m', '1h'
  channels: AlertChannel[];
  metadata?: Record<string, any>;
  hipaaRelevant?: boolean;
  autoResolve?: boolean;
  escalation?: EscalationRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms' | 'teams' | 'discord';
  config: Record<string, any>;
  enabled: boolean;
  filter?: {
    severities?: string[];
    categories?: string[];
    services?: string[];
  };
}

export interface EscalationRule {
  level: number;
  delay: string; // e.g., '15m', '1h'
  channels: AlertChannel[];
  condition?: {
    noAcknowledgment?: boolean;
    noResolution?: boolean;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  category: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated';
  title: string;
  description: string;
  source: string;
  service: string;
  timestamp: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  metadata: Record<string, any>;
  context?: HealthcareLogContext;
  escalationLevel: number;
  cooldownUntil?: Date;
  fingerprint: string;
  relatedAlerts?: string[];
  hipaaRelevant: boolean;
}

export interface AlertingMetrics {
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByCategory: Record<string, number>;
  alertsByService: Record<string, number>;
  averageResolutionTime: number;
  falsePositiveRate: number;
  acknowledgmentRate: number;
  escalationRate: number;
  lastAlert?: {
    id: string;
    severity: string;
    timestamp: Date;
  };
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly activeAlerts = new Map<string, Alert>();
  private readonly alertRules = new Map<string, AlertRule>();
  private readonly alertHistory: Alert[] = [];
  private readonly metrics: AlertingMetrics = {
    totalAlerts: 0,
    alertsBySeverity: {},
    alertsByCategory: {},
    alertsByService: {},
    averageResolutionTime: 0,
    falsePositiveRate: 0,
    acknowledgmentRate: 0,
    escalationRate: 0
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService,
    private readonly httpService: HttpService
  ) {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alerting rules for healthcare applications
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Security alerts
      {
        id: 'security-multiple-failed-logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Multiple failed login attempts detected from same IP',
        severity: 'high',
        category: 'security',
        condition: {
          metric: 'failed_login_attempts',
          operator: 'gte',
          threshold: 5,
          window: '5m',
          aggregation: 'count'
        },
        enabled: true,
        cooldown: '30m',
        channels: this.getDefaultSecurityChannels(),
        hipaaRelevant: true,
        autoResolve: false,
        escalation: [
          {
            level: 1,
            delay: '15m',
            channels: this.getDefaultSecurityChannels(),
            condition: { noAcknowledgment: true }
          }
        ]
      },
      {
        id: 'security-unauthorized-phi-access',
        name: 'Unauthorized PHI Access Attempt',
        description: 'Attempt to access PHI without proper authorization',
        severity: 'critical',
        category: 'security',
        condition: {
          metric: 'unauthorized_phi_access',
          operator: 'gt',
          threshold: 0,
          window: '1m',
          aggregation: 'count'
        },
        enabled: true,
        cooldown: '10m',
        channels: this.getDefaultCriticalChannels(),
        hipaaRelevant: true,
        autoResolve: false,
        escalation: [
          {
            level: 1,
            delay: '5m',
            channels: this.getDefaultCriticalChannels(),
            condition: { noAcknowledgment: true }
          },
          {
            level: 2,
            delay: '15m',
            channels: this.getDefaultEscalationChannels(),
            condition: { noAcknowledgment: true }
          }
        ]
      },

      // Performance alerts
      {
        id: 'performance-high-response-time',
        name: 'High API Response Time',
        description: 'API response time exceeds acceptable threshold',
        severity: 'medium',
        category: 'performance',
        condition: {
          metric: 'api_response_time',
          operator: 'gt',
          threshold: 5000,
          window: '5m',
          aggregation: 'avg'
        },
        enabled: true,
        cooldown: '15m',
        channels: this.getDefaultPerformanceChannels(),
        hipaaRelevant: false,
        autoResolve: true
      },
      {
        id: 'performance-high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        severity: 'high',
        category: 'performance',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5,
          window: '5m',
          aggregation: 'avg'
        },
        enabled: true,
        cooldown: '10m',
        channels: this.getDefaultPerformanceChannels(),
        hipaaRelevant: false,
        autoResolve: true
      },

      // System alerts
      {
        id: 'system-database-connection-failure',
        name: 'Database Connection Failure',
        description: 'Unable to connect to database',
        severity: 'critical',
        category: 'system',
        condition: {
          metric: 'database_connection_failures',
          operator: 'gt',
          threshold: 0,
          window: '1m',
          aggregation: 'count'
        },
        enabled: true,
        cooldown: '5m',
        channels: this.getDefaultCriticalChannels(),
        hipaaRelevant: true,
        autoResolve: false
      },
      {
        id: 'system-high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds safe threshold',
        severity: 'medium',
        category: 'system',
        condition: {
          metric: 'memory_usage_percent',
          operator: 'gt',
          threshold: 85,
          window: '5m',
          aggregation: 'avg'
        },
        enabled: true,
        cooldown: '30m',
        channels: this.getDefaultSystemChannels(),
        hipaaRelevant: false,
        autoResolve: true
      },

      // Healthcare business alerts
      {
        id: 'business-session-recording-failure',
        name: 'Session Recording Failure',
        description: 'Healthcare session recording has failed',
        severity: 'high',
        category: 'business',
        condition: {
          metric: 'session_recording_failures',
          operator: 'gt',
          threshold: 0,
          window: '1m',
          aggregation: 'count'
        },
        enabled: true,
        cooldown: '15m',
        channels: this.getDefaultBusinessChannels(),
        hipaaRelevant: true,
        autoResolve: false
      },
      {
        id: 'business-appointment-system-down',
        name: 'Appointment System Unavailable',
        description: 'Appointment booking system is not responding',
        severity: 'critical',
        category: 'business',
        condition: {
          metric: 'appointment_system_health',
          operator: 'eq',
          threshold: 0,
          window: '2m',
          aggregation: 'min'
        },
        enabled: true,
        cooldown: '5m',
        channels: this.getDefaultCriticalChannels(),
        hipaaRelevant: true,
        autoResolve: false
      },

      // Compliance alerts
      {
        id: 'compliance-audit-log-failure',
        name: 'Audit Log Recording Failure',
        description: 'HIPAA audit logs are not being recorded properly',
        severity: 'critical',
        category: 'compliance',
        condition: {
          metric: 'audit_log_failures',
          operator: 'gt',
          threshold: 0,
          window: '1m',
          aggregation: 'count'
        },
        enabled: true,
        cooldown: '5m',
        channels: this.getDefaultComplianceChannels(),
        hipaaRelevant: true,
        autoResolve: false,
        escalation: [
          {
            level: 1,
            delay: '5m',
            channels: this.getDefaultCriticalChannels(),
            condition: { noAcknowledgment: true }
          }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.centralizedLogger.info('Default alerting rules initialized', {
      ruleCount: defaultRules.length,
      service: 'alerting-service'
    });
  }

  /**
   * Trigger an alert based on metrics or events
   */
  async triggerAlert(
    ruleId: string,
    value: number | string,
    context?: HealthcareLogContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) {
      return;
    }

    // Check if alert meets condition
    if (!this.evaluateCondition(rule.condition, value)) {
      return;
    }

    const fingerprint = this.generateFingerprint(rule, context);
    const existingAlert = this.findActiveAlert(fingerprint);

    // Check cooldown period
    if (existingAlert?.cooldownUntil && new Date() < existingAlert.cooldownUntil) {
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      category: rule.category,
      status: 'open',
      title: rule.name,
      description: this.formatAlertDescription(rule, value, context),
      source: context?.service || 'clinic-app',
      service: context?.service || 'unknown',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        triggerValue: value,
        rule: {
          condition: rule.condition,
          threshold: rule.condition.threshold
        }
      },
      context,
      escalationLevel: 0,
      cooldownUntil: this.calculateCooldownEnd(rule.cooldown),
      fingerprint,
      hipaaRelevant: rule.hipaaRelevant || false
    };

    // Store the alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.updateMetrics(alert);

    // Log the alert
    this.centralizedLogger.auditLog(`Alert triggered: ${alert.title}`, {
      ...context,
      alertId: alert.id,
      severity: alert.severity,
      category: alert.category,
      hipaaRelevant: alert.hipaaRelevant,
      auditRequired: true
    });

    // Send notifications
    await this.sendAlertNotifications(alert, rule);

    // Schedule escalation if configured
    if (rule.escalation && rule.escalation.length > 0) {
      this.scheduleEscalation(alert, rule.escalation[0]);
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.centralizedLogger.auditLog(`Alert acknowledged: ${alert.title}`, {
      alertId: alert.id,
      acknowledgedBy,
      severity: alert.severity,
      auditRequired: true,
      hipaaRelevant: alert.hipaaRelevant
    });

    // Cancel escalation
    this.cancelEscalation(alertId);

    // Notify acknowledgment
    await this.sendAcknowledgmentNotifications(alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    this.centralizedLogger.auditLog(`Alert resolved: ${alert.title}`, {
      alertId: alert.id,
      resolvedBy,
      severity: alert.severity,
      resolutionTime: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      auditRequired: true,
      hipaaRelevant: alert.hipaaRelevant
    });

    // Cancel escalation
    this.cancelEscalation(alertId);

    // Notify resolution
    await this.sendResolutionNotifications(alert);
    
    // Update metrics
    this.updateResolutionMetrics(alert);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filters?: {
    severity?: string[];
    category?: string[];
    service?: string[];
    hipaaRelevant?: boolean;
  }): Alert[] {
    let alerts = Array.from(this.activeAlerts.values());

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => filters.severity!.includes(alert.severity));
      }
      if (filters.category) {
        alerts = alerts.filter(alert => filters.category!.includes(alert.category));
      }
      if (filters.service) {
        alerts = alerts.filter(alert => filters.service!.includes(alert.service));
      }
      if (filters.hipaaRelevant !== undefined) {
        alerts = alerts.filter(alert => alert.hipaaRelevant === filters.hipaaRelevant);
      }
    }

    return alerts.sort((a, b) => {
      // Sort by severity (critical first), then by timestamp
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Get alerting metrics
   */
  getMetrics(): AlertingMetrics {
    return { ...this.metrics };
  }

  /**
   * Add or update an alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    
    this.centralizedLogger.info(`Alert rule ${rule.enabled ? 'enabled' : 'disabled'}: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      category: rule.category,
      service: 'alerting-service'
    });
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Health check for alerting system
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const activeAlertCount = this.activeAlerts.size;
      const criticalAlerts = Array.from(this.activeAlerts.values())
        .filter(alert => alert.severity === 'critical').length;
      
      const enabledRules = Array.from(this.alertRules.values())
        .filter(rule => rule.enabled).length;

      return {
        status: criticalAlerts > 5 ? 'unhealthy' : activeAlertCount > 20 ? 'degraded' : 'healthy',
        details: {
          activeAlerts: activeAlertCount,
          criticalAlerts,
          enabledRules,
          totalRules: this.alertRules.size,
          metrics: this.metrics,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Private helper methods

  private evaluateCondition(condition: AlertRule['condition'], value: number | string): boolean {
    const { operator, threshold } = condition;
    
    if (typeof value === 'number' && typeof threshold === 'number') {
      switch (operator) {
        case 'gt': return value > threshold;
        case 'gte': return value >= threshold;
        case 'lt': return value < threshold;
        case 'lte': return value <= threshold;
        case 'eq': return value === threshold;
        case 'ne': return value !== threshold;
        default: return false;
      }
    }
    
    if (typeof value === 'string' && typeof threshold === 'string') {
      switch (operator) {
        case 'eq': return value === threshold;
        case 'ne': return value !== threshold;
        case 'contains': return value.includes(threshold);
        case 'not_contains': return !value.includes(threshold);
        default: return false;
      }
    }
    
    return false;
  }

  private generateFingerprint(rule: AlertRule, context?: HealthcareLogContext): string {
    const components = [
      rule.id,
      context?.service || 'unknown',
      context?.userId || 'anonymous',
      context?.ipAddress || 'unknown'
    ];
    
    return Buffer.from(components.join('|')).toString('base64');
  }

  private findActiveAlert(fingerprint: string): Alert | undefined {
    return Array.from(this.activeAlerts.values())
      .find(alert => alert.fingerprint === fingerprint);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private formatAlertDescription(
    rule: AlertRule, 
    value: number | string, 
    context?: HealthcareLogContext
  ): string {
    let description = rule.description;
    
    if (context?.service) {
      description += ` (Service: ${context.service})`;
    }
    
    if (context?.userId) {
      description += ` (User: ${context.userId})`;
    }
    
    description += ` (Value: ${value}, Threshold: ${rule.condition.threshold})`;
    
    return description;
  }

  private calculateCooldownEnd(cooldown: string): Date {
    const now = new Date();
    const duration = this.parseDuration(cooldown);
    return new Date(now.getTime() + duration);
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }

  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    const notifications = rule.channels
      .filter(channel => channel.enabled)
      .filter(channel => this.shouldSendToChannel(alert, channel))
      .map(channel => this.sendNotification(alert, channel));
    
    await Promise.allSettled(notifications);
  }

  private shouldSendToChannel(alert: Alert, channel: AlertChannel): boolean {
    const filter = channel.filter;
    if (!filter) return true;
    
    if (filter.severities && !filter.severities.includes(alert.severity)) {
      return false;
    }
    
    if (filter.categories && !filter.categories.includes(alert.category)) {
      return false;
    }
    
    if (filter.services && !filter.services.includes(alert.service)) {
      return false;
    }
    
    return true;
  }

  private async sendNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert, channel);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, channel);
          break;
        case 'teams':
          await this.sendTeamsNotification(alert, channel);
          break;
        default:
          this.logger.warn(`Unsupported notification channel: ${channel.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send ${channel.type} notification for alert ${alert.id}`, error);
    }
  }

  private async sendEmailNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementation would integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Would send email notification for alert: ${alert.title}`);
  }

  private async sendSlackNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    if (!channel.config.webhookUrl) return;
    
    const color = {
      critical: '#FF0000',
      high: '#FF8C00',
      medium: '#FFD700',
      low: '#32CD32',
      info: '#87CEEB'
    }[alert.severity] || '#808080';
    
    const payload = {
      attachments: [{
        color,
        title: `🚨 ${alert.title}`,
        text: alert.description,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Category', value: alert.category, short: true },
          { title: 'Service', value: alert.service, short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ],
        footer: 'Clinic App Monitoring',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };
    
    await firstValueFrom(
      this.httpService.post(channel.config.webhookUrl, payload)
    );
  }

  private async sendWebhookNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    if (!channel.config.url) return;
    
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'clinic-app-alerting'
    };
    
    await firstValueFrom(
      this.httpService.post(channel.config.url, payload, {
        headers: channel.config.headers || {}
      })
    );
  }

  private async sendPagerDutyNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementation would integrate with PagerDuty API
    this.logger.log(`Would send PagerDuty notification for alert: ${alert.title}`);
  }

  private async sendSMSNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementation would integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`Would send SMS notification for alert: ${alert.title}`);
  }

  private async sendTeamsNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementation would integrate with Microsoft Teams
    this.logger.log(`Would send Teams notification for alert: ${alert.title}`);
  }

  private async sendAcknowledgmentNotifications(alert: Alert): Promise<void> {
    // Send acknowledgment notifications to relevant channels
    this.logger.log(`Alert acknowledged: ${alert.title} by ${alert.acknowledgedBy}`);
  }

  private async sendResolutionNotifications(alert: Alert): Promise<void> {
    // Send resolution notifications to relevant channels
    this.logger.log(`Alert resolved: ${alert.title}`);
  }

  private scheduleEscalation(alert: Alert, escalation: EscalationRule): void {
    const delay = this.parseDuration(escalation.delay);
    
    setTimeout(async () => {
      const currentAlert = this.activeAlerts.get(alert.id);
      if (!currentAlert || currentAlert.status !== 'open') {
        return; // Alert was resolved or acknowledged
      }
      
      // Check escalation condition
      if (escalation.condition?.noAcknowledgment && currentAlert.status !== 'open') {
        return;
      }
      
      currentAlert.status = 'escalated';
      currentAlert.escalationLevel = escalation.level;
      
      // Send escalation notifications
      const notifications = escalation.channels.map(channel =>
        this.sendNotification(currentAlert, channel)
      );
      
      await Promise.allSettled(notifications);
      
      this.centralizedLogger.securityLog(`Alert escalated to level ${escalation.level}: ${alert.title}`, {
        alertId: alert.id,
        escalationLevel: escalation.level,
        severity: alert.severity,
        alertLevel: 'high'
      });
    }, delay);
  }

  private cancelEscalation(alertId: string): void {
    // Implementation would cancel scheduled escalations
    // This could involve clearing timeouts or removing from a job queue
  }

  private updateMetrics(alert: Alert): void {
    this.metrics.totalAlerts++;
    this.metrics.alertsBySeverity[alert.severity] = 
      (this.metrics.alertsBySeverity[alert.severity] || 0) + 1;
    this.metrics.alertsByCategory[alert.category] = 
      (this.metrics.alertsByCategory[alert.category] || 0) + 1;
    this.metrics.alertsByService[alert.service] = 
      (this.metrics.alertsByService[alert.service] || 0) + 1;
    
    this.metrics.lastAlert = {
      id: alert.id,
      severity: alert.severity,
      timestamp: alert.timestamp
    };
  }

  private updateResolutionMetrics(alert: Alert): void {
    if (alert.resolvedAt) {
      const resolutionTime = alert.resolvedAt.getTime() - alert.timestamp.getTime();
      
      // Update average resolution time
      const currentAvg = this.metrics.averageResolutionTime;
      const totalResolved = this.alertHistory.filter(a => a.resolvedAt).length;
      
      this.metrics.averageResolutionTime = 
        (currentAvg * (totalResolved - 1) + resolutionTime) / totalResolved;
    }
    
    if (alert.acknowledgedAt) {
      const totalAlerts = this.metrics.totalAlerts;
      const acknowledgedAlerts = this.alertHistory.filter(a => a.acknowledgedAt).length;
      this.metrics.acknowledgmentRate = (acknowledgedAlerts / totalAlerts) * 100;
    }
  }

  // Cron job for cleanup and health checks
  @Cron(CronExpression.EVERY_HOUR)
  private async performMaintenanceTasks(): Promise<void> {
    // Clean up old resolved alerts from history
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const initialCount = this.alertHistory.length;
    
    this.alertHistory.splice(0, this.alertHistory.length, 
      ...this.alertHistory.filter(alert => 
        alert.timestamp > cutoffDate || alert.status === 'open'
      )
    );
    
    const cleaned = initialCount - this.alertHistory.length;
    if (cleaned > 0) {
      this.centralizedLogger.info(`Cleaned up ${cleaned} old alerts from history`, {
        service: 'alerting-service',
        action: 'maintenance_cleanup'
      });
    }
    
    // Auto-resolve alerts that should be auto-resolved
    const autoResolveAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => {
        const rule = this.alertRules.get(alert.ruleId);
        return rule?.autoResolve && 
               Date.now() - alert.timestamp.getTime() > 60 * 60 * 1000; // 1 hour
      });
    
    for (const alert of autoResolveAlerts) {
      await this.resolveAlert(alert.id, 'auto-resolver');
    }
  }

  // Default channel configurations
  private getDefaultSecurityChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['security@clinic-app.com'] },
        enabled: true,
        filter: { severities: ['critical', 'high'] }
      },
      {
        type: 'slack',
        config: { webhookUrl: process.env.SLACK_SECURITY_WEBHOOK },
        enabled: !!process.env.SLACK_SECURITY_WEBHOOK,
        filter: { severities: ['critical', 'high', 'medium'] }
      }
    ];
  }

  private getDefaultCriticalChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['critical@clinic-app.com'] },
        enabled: true
      },
      {
        type: 'pagerduty',
        config: { serviceKey: process.env.PAGERDUTY_SERVICE_KEY },
        enabled: !!process.env.PAGERDUTY_SERVICE_KEY
      },
      {
        type: 'sms',
        config: { recipients: ['+1234567890'] },
        enabled: !!process.env.SMS_ENABLED
      }
    ];
  }

  private getDefaultEscalationChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['escalation@clinic-app.com'] },
        enabled: true
      },
      {
        type: 'pagerduty',
        config: { serviceKey: process.env.PAGERDUTY_ESCALATION_KEY },
        enabled: !!process.env.PAGERDUTY_ESCALATION_KEY
      }
    ];
  }

  private getDefaultPerformanceChannels(): AlertChannel[] {
    return [
      {
        type: 'slack',
        config: { webhookUrl: process.env.SLACK_PERFORMANCE_WEBHOOK },
        enabled: !!process.env.SLACK_PERFORMANCE_WEBHOOK
      }
    ];
  }

  private getDefaultSystemChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['devops@clinic-app.com'] },
        enabled: true
      }
    ];
  }

  private getDefaultBusinessChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['business@clinic-app.com'] },
        enabled: true
      },
      {
        type: 'slack',
        config: { webhookUrl: process.env.SLACK_BUSINESS_WEBHOOK },
        enabled: !!process.env.SLACK_BUSINESS_WEBHOOK
      }
    ];
  }

  private getDefaultComplianceChannels(): AlertChannel[] {
    return [
      {
        type: 'email',
        config: { recipients: ['compliance@clinic-app.com'] },
        enabled: true
      },
      {
        type: 'pagerduty',
        config: { serviceKey: process.env.PAGERDUTY_COMPLIANCE_KEY },
        enabled: !!process.env.PAGERDUTY_COMPLIANCE_KEY
      }
    ];
  }
}