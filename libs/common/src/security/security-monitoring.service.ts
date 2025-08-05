import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';
import { VulnerabilityScanner, VulnerabilityReport } from './vulnerability-scanner.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'vulnerability' | 'compliance' | 'intrusion' | 'anomaly';
  title: string;
  description: string;
  affectedSystems: string[];
  healthcareImpact: string;
  complianceRisk: string[];
  actionRequired: string;
  escalated: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  assignedTo?: string;
}

export interface SecurityMetrics {
  timestamp: Date;
  vulnerabilityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  complianceStatus: {
    hipaa: boolean;
    sox: boolean;
    pci: boolean;
    gdpr: boolean;
    overallScore: number;
  };
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  securityScore: number; // 0-100
  lastScanDate: Date;
  nextScanDate: Date;
  alertsActive: number;
  remediationProgress: number; // percentage
}

export interface ThreatIntelligence {
  source: string;
  timestamp: Date;
  threatType: 'apt' | 'malware' | 'vulnerability' | 'exploit';
  severity: 'critical' | 'high' | 'medium' | 'low';
  indicators: string[];
  description: string;
  healthcareRelevance: boolean;
  mitigation: string[];
}

/**
 * Security Monitoring Service
 * 
 * Provides continuous security monitoring, threat detection, and automated
 * response capabilities for healthcare-grade clinic management platform.
 * 
 * Features:
 * - Continuous vulnerability monitoring and assessment
 * - Real-time security alerting and escalation
 * - Healthcare-specific threat intelligence integration
 * - Compliance monitoring (HIPAA, SOX, PCI, GDPR)
 * - Automated security reporting and dashboards
 * - Incident response coordination and tracking
 * - Security metrics and KPI tracking
 */
@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly alerts = new Map<string, SecurityAlert>();
  private readonly metrics: SecurityMetrics[] = [];
  private currentThreatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService,
    private readonly vulnerabilityScanner: VulnerabilityScanner
  ) {
    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize security monitoring system
   */
  private async initializeSecurityMonitoring(): Promise<void> {
    try {
      this.logger.log('Initializing security monitoring system...');

      // Load existing alerts and metrics
      await this.loadPersistedData();

      // Initialize baseline metrics
      await this.updateSecurityMetrics();

      // Start continuous monitoring
      await this.startContinuousMonitoring();

      this.logger.log('Security monitoring system initialized successfully');

      await this.centralizedLogger.auditLog('Security monitoring system initialized', {
        threatLevel: this.currentThreatLevel,
        activeAlerts: this.alerts.size,
        service: 'security-monitoring'
      });

    } catch (error) {
      this.logger.error('Failed to initialize security monitoring:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive security assessment
   */
  async performSecurityAssessment(): Promise<{
    vulnerabilityReport: VulnerabilityReport;
    securityMetrics: SecurityMetrics;
    activeAlerts: SecurityAlert[];
    threatLevel: string;
    recommendations: string[];
  }> {
    try {
      this.logger.log('Performing comprehensive security assessment...');

      // Run vulnerability scan
      const vulnerabilityReport = await this.vulnerabilityScanner.performComprehensiveScan({
        enableDependencyScanning: true,
        enableContainerScanning: true,
        enableCodeScanning: true,
        enableInfrastructureScanning: true,
        healthcareFocused: true
      });

      // Update security metrics
      await this.updateSecurityMetrics();

      // Generate new alerts based on findings
      await this.processVulnerabilityReport(vulnerabilityReport);

      // Get current metrics and alerts
      const currentMetrics = this.getCurrentMetrics();
      const activeAlerts = this.getActiveAlerts();

      // Update threat level
      this.updateThreatLevel(vulnerabilityReport, activeAlerts);

      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(
        vulnerabilityReport,
        activeAlerts
      );

      const assessment = {
        vulnerabilityReport,
        securityMetrics: currentMetrics,
        activeAlerts,
        threatLevel: this.currentThreatLevel,
        recommendations
      };

      await this.centralizedLogger.auditLog('Security assessment completed', {
        vulnerabilitiesFound: vulnerabilityReport.summary.total,
        criticalVulnerabilities: vulnerabilityReport.summary.critical,
        threatLevel: this.currentThreatLevel,
        activeAlerts: activeAlerts.length,
        securityScore: currentMetrics.securityScore,
        service: 'security-monitoring'
      });

      return assessment;

    } catch (error) {
      this.logger.error('Security assessment failed:', error);
      throw error;
    }
  }

  /**
   * Process vulnerability report and generate alerts
   */
  private async processVulnerabilityReport(report: VulnerabilityReport): Promise<void> {
    // Generate alerts for critical and high severity vulnerabilities
    const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = report.vulnerabilities.filter(v => v.severity === 'high');
    const phiRiskVulns = report.vulnerabilities.filter(v => v.phiRisk);

    // Critical vulnerability alert
    if (criticalVulns.length > 0) {
      await this.createAlert({
        severity: 'critical',
        type: 'vulnerability',
        title: `${criticalVulns.length} Critical Security Vulnerabilities Detected`,
        description: `Critical vulnerabilities found that require immediate attention: ${criticalVulns.map(v => v.title).join(', ')}`,
        affectedSystems: [...new Set(criticalVulns.map(v => v.affectedComponent))],
        healthcareImpact: 'Potential PHI data breach and HIPAA compliance violation',
        complianceRisk: ['HIPAA', 'SOX', 'PCI', 'GDPR'],
        actionRequired: 'Immediate patching and security remediation required'
      });
    }

    // PHI risk alert
    if (phiRiskVulns.length > 0) {
      await this.createAlert({
        severity: 'high',
        type: 'compliance',
        title: `${phiRiskVulns.length} PHI-Related Security Vulnerabilities`,
        description: 'Vulnerabilities detected in components that process PHI data',
        affectedSystems: [...new Set(phiRiskVulns.map(v => v.affectedComponent))],
        healthcareImpact: 'Direct risk to patient data confidentiality and integrity',
        complianceRisk: ['HIPAA'],
        actionRequired: 'Priority remediation required for HIPAA compliance'
      });
    }

    // Compliance status alert
    if (!report.complianceStatus.hipaa) {
      await this.createAlert({
        severity: 'high',
        type: 'compliance',
        title: 'HIPAA Compliance Violation Detected',
        description: 'Current security posture does not meet HIPAA requirements',
        affectedSystems: ['Overall System'],
        healthcareImpact: 'Regulatory compliance risk and potential penalties',
        complianceRisk: ['HIPAA'],
        actionRequired: 'Immediate compliance remediation required'
      });
    }
  }

  /**
   * Create security alert
   */
  private async createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'escalated' | 'resolved'>): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      escalated: alertData.severity === 'critical',
      resolved: false,
      ...alertData
    };

    this.alerts.set(alert.id, alert);

    // Log alert creation
    await this.centralizedLogger.auditLog('Security alert created', {
      alertId: alert.id,
      severity: alert.severity,
      type: alert.type,
      title: alert.title,
      healthcareImpact: alert.healthcareImpact,
      service: 'security-monitoring'
    });

    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      await this.escalateAlert(alert.id);
    }

    this.logger.warn(`Security alert created: ${alert.severity.toUpperCase()} - ${alert.title}`);

    return alert;
  }

  /**
   * Escalate security alert
   */
  async escalateAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.escalated = true;
    alert.assignedTo = 'security-team';

    await this.centralizedLogger.auditLog('Security alert escalated', {
      alertId,
      severity: alert.severity,
      title: alert.title,
      escalatedTo: alert.assignedTo,
      service: 'security-monitoring'
    });

    // Send notifications (integrate with Slack, email, etc.)
    await this.sendAlertNotification(alert);

    this.logger.error(`ESCALATED SECURITY ALERT: ${alert.title} (ID: ${alertId})`);
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    await this.centralizedLogger.auditLog('Security alert resolved', {
      alertId,
      resolution,
      resolutionTime: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
      service: 'security-monitoring'
    });

    this.logger.log(`Security alert resolved: ${alert.title} (ID: ${alertId})`);
  }

  /**
   * Update security metrics
   */
  private async updateSecurityMetrics(): Promise<void> {
    const latestScan = this.vulnerabilityScanner.getAllScanResults()
      .sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime())[0];

    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;

    const metrics: SecurityMetrics = {
      timestamp: new Date(),
      vulnerabilityCount: latestScan ? latestScan.summary : {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      complianceStatus: latestScan ? {
        ...latestScan.complianceStatus,
        overallScore: this.calculateComplianceScore(latestScan.complianceStatus)
      } : {
        hipaa: false,
        sox: false,
        pci: false,
        gdpr: false,
        overallScore: 0
      },
      threatLevel: this.currentThreatLevel,
      securityScore: this.calculateSecurityScore(latestScan, activeAlerts),
      lastScanDate: latestScan?.scanDate || new Date(0),
      nextScanDate: latestScan?.nextScanDate || new Date(),
      alertsActive: activeAlerts.length,
      remediationProgress: this.calculateRemediationProgress()
    };

    this.metrics.push(metrics);

    // Keep only last 30 days of metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > thirtyDaysAgo);
    this.metrics.length = 0;
    this.metrics.push(...recentMetrics);
  }

  /**
   * Update threat level based on current security state
   */
  private updateThreatLevel(
    vulnerabilityReport: VulnerabilityReport,
    activeAlerts: SecurityAlert[]
  ): void {
    const criticalVulns = vulnerabilityReport.summary.critical;
    const highVulns = vulnerabilityReport.summary.high;
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    const phiRiskVulns = vulnerabilityReport.vulnerabilities.filter(v => v.phiRisk).length;

    if (criticalVulns > 0 || criticalAlerts > 0 || phiRiskVulns > 2) {
      this.currentThreatLevel = 'critical';
    } else if (highVulns > 5 || phiRiskVulns > 0) {
      this.currentThreatLevel = 'high';
    } else if (highVulns > 0 || vulnerabilityReport.summary.medium > 10) {
      this.currentThreatLevel = 'medium';
    } else {
      this.currentThreatLevel = 'low';
    }
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(
    report: VulnerabilityReport,
    alerts: SecurityAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (report.summary.critical > 0) {
      recommendations.push('Immediately patch all critical vulnerabilities');
      recommendations.push('Implement emergency security response procedures');
    }

    if (report.vulnerabilities.some(v => v.phiRisk)) {
      recommendations.push('Prioritize remediation of PHI-related vulnerabilities');
      recommendations.push('Conduct HIPAA risk assessment');
    }

    if (!report.complianceStatus.hipaa) {
      recommendations.push('Implement comprehensive HIPAA compliance measures');
      recommendations.push('Schedule compliance audit with healthcare security team');
    }

    if (alerts.length > 10) {
      recommendations.push('Increase security monitoring frequency');
      recommendations.push('Review and optimize alert management processes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current security posture');
      recommendations.push('Continue regular vulnerability scanning');
      recommendations.push('Monitor for emerging threats');
    }

    return recommendations;
  }

  /**
   * Automated security scanning (runs weekly)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async performAutomatedScan(): Promise<void> {
    try {
      this.logger.log('Starting automated weekly security scan...');

      await this.performSecurityAssessment();

      this.logger.log('Automated security scan completed successfully');

    } catch (error) {
      this.logger.error('Automated security scan failed:', error);
      
      await this.createAlert({
        severity: 'medium',
        type: 'anomaly',
        title: 'Automated Security Scan Failed',
        description: `Weekly automated security scan failed: ${error.message}`,
        affectedSystems: ['Security Monitoring System'],
        healthcareImpact: 'Reduced security visibility and monitoring coverage',
        complianceRisk: ['HIPAA'],
        actionRequired: 'Investigate scan failure and restore automated monitoring'
      });
    }
  }

  /**
   * Daily security metrics update
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async updateDailyMetrics(): Promise<void> {
    try {
      await this.updateSecurityMetrics();
      await this.cleanupResolvedAlerts();
      this.vulnerabilityScanner.cleanupOldScans();
      
      this.logger.log('Daily security metrics updated');
    } catch (error) {
      this.logger.error('Failed to update daily metrics:', error);
    }
  }

  /**
   * Start continuous monitoring
   */
  private async startContinuousMonitoring(): Promise<void> {
    // Monitor for new threats every hour
    setInterval(async () => {
      try {
        await this.checkForNewThreats();
      } catch (error) {
        this.logger.error('Continuous monitoring check failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Check for new threats and anomalies
   */
  private async checkForNewThreats(): Promise<void> {
    // Simulate threat intelligence check
    // In production, integrate with threat intelligence feeds
    
    const currentTime = new Date();
    const lastCheck = new Date(currentTime.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Check for anomalous patterns in logs, metrics, etc.
    // This would integrate with SIEM, threat intelligence, etc.
  }

  /**
   * Utility methods
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentMetrics(): SecurityMetrics {
    return this.metrics[this.metrics.length - 1] || {
      timestamp: new Date(),
      vulnerabilityCount: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      complianceStatus: { hipaa: false, sox: false, pci: false, gdpr: false, overallScore: 0 },
      threatLevel: 'low',
      securityScore: 50,
      lastScanDate: new Date(0),
      nextScanDate: new Date(),
      alertsActive: 0,
      remediationProgress: 0
    };
  }

  private getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  private calculateComplianceScore(compliance: any): number {
    const scores = Object.values(compliance).filter(v => typeof v === 'boolean');
    const trueCount = scores.filter(Boolean).length;
    return Math.round((trueCount / scores.length) * 100);
  }

  private calculateSecurityScore(
    latestScan: VulnerabilityReport | undefined,
    activeAlerts: SecurityAlert[]
  ): number {
    let score = 100;

    if (latestScan) {
      score -= latestScan.summary.critical * 20;
      score -= latestScan.summary.high * 10;
      score -= latestScan.summary.medium * 2;
      score -= latestScan.summary.low * 0.5;
    }

    score -= activeAlerts.filter(a => a.severity === 'critical').length * 15;
    score -= activeAlerts.filter(a => a.severity === 'high').length * 5;

    return Math.max(0, Math.round(score));
  }

  private calculateRemediationProgress(): number {
    const resolvedAlerts = Array.from(this.alerts.values()).filter(a => a.resolved).length;
    const totalAlerts = this.alerts.size;
    
    if (totalAlerts === 0) return 100;
    return Math.round((resolvedAlerts / totalAlerts) * 100);
  }

  private async sendAlertNotification(alert: SecurityAlert): Promise<void> {
    // Implement notification logic (Slack, email, SMS, etc.)
    this.logger.warn(`NOTIFICATION: ${alert.severity.toUpperCase()} alert - ${alert.title}`);
  }

  private async cleanupResolvedAlerts(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < thirtyDaysAgo) {
        this.alerts.delete(alertId);
      }
    }
  }

  private async loadPersistedData(): Promise<void> {
    // In production, load from database or persistent storage
    this.logger.log('Loading persisted security data...');
  }

  /**
   * Public API methods
   */
  getSecurityMetrics(): SecurityMetrics {
    return this.getCurrentMetrics();
  }

  getActiveSecurityAlerts(): SecurityAlert[] {
    return this.getActiveAlerts();
  }

  getCurrentThreatLevel(): string {
    return this.currentThreatLevel;
  }

  getSecurityAlert(alertId: string): SecurityAlert | undefined {
    return this.alerts.get(alertId);
  }

  getAllSecurityAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values());
  }

  getMetricsHistory(days: number = 30): SecurityMetrics[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }
}