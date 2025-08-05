import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  SecurityMonitoringService, 
  VulnerabilityScanner,
  SecurityAlert,
  SecurityMetrics,
  VulnerabilityReport 
} from '@clinic/common/security';
import { CentralizedLoggerService } from '@clinic/common/logging/centralized-logger.service';

interface SecurityAssessmentQuery {
  includeRecommendations?: boolean;
  fullReport?: boolean;
}

interface ResolveAlertDto {
  resolution: string;
  assignedTo?: string;
}

/**
 * Security Monitoring Controller
 * 
 * Provides administrative endpoints for security monitoring, vulnerability
 * management, and threat detection in healthcare-grade environments.
 * 
 * Healthcare Compliance:
 * - All security activities are audit-logged for HIPAA compliance
 * - PHI risk assessment and healthcare-specific threat analysis
 * - Real-time security alerting with healthcare impact assessment
 * - Compliance status monitoring (HIPAA, SOX, PCI, GDPR)
 */
@ApiTags('Security Monitoring')
@ApiBearerAuth('JWT-auth')
@Controller('security-monitoring')
export class SecurityMonitoringController {
  constructor(
    private readonly securityMonitoringService: SecurityMonitoringService,
    private readonly vulnerabilityScanner: VulnerabilityScanner,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  /**
   * Perform comprehensive security assessment
   * 
   * Executes a full security assessment including vulnerability scanning,
   * threat analysis, and compliance evaluation with healthcare focus.
   */
  @Post('assessment')
  @ApiOperation({
    summary: 'Perform comprehensive security assessment',
    description: `
    Executes a comprehensive security assessment for the clinic management platform:
    
    **Assessment Components:**
    - Dependency vulnerability scanning (npm, yarn packages)
    - Container security scanning (Docker images, base images)
    - Source code security analysis (SAST patterns)
    - Infrastructure configuration review (K8s, Docker, configs)
    - Healthcare-specific risk assessment and PHI impact analysis
    
    **Healthcare Focus:**
    - PHI data exposure risk assessment
    - HIPAA compliance gap analysis
    - Healthcare threat intelligence integration
    - Clinical workflow impact evaluation
    - Emergency access security validation
    
    **Compliance Coverage:**
    - HIPAA (Health Insurance Portability and Accountability Act)
    - SOX (Sarbanes-Oxley Act) for financial controls
    - PCI DSS (Payment Card Industry) for payment processing
    - GDPR (General Data Protection Regulation) for data privacy
    
    **Output:**
    - Detailed vulnerability report with severity ratings
    - Security metrics and compliance status
    - Active security alerts and escalations
    - Current threat level assessment
    - Actionable security recommendations
    
    **Use Cases:**
    - Monthly security reviews and audits
    - Pre-deployment security validation
    - Incident response and forensic analysis
    - Compliance audits and regulatory reporting
    - Executive security dashboard updates
    `
  })
  @ApiQuery({
    name: 'includeRecommendations',
    required: false,
    type: Boolean,
    description: 'Include detailed security recommendations in the response'
  })
  @ApiQuery({
    name: 'fullReport',
    required: false,
    type: Boolean,
    description: 'Generate comprehensive report with all security details'
  })
  @ApiResponse({
    status: 200,
    description: 'Security assessment completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            vulnerabilityReport: {
              type: 'object',
              properties: {
                scanId: { type: 'string', example: 'scan_1704067200000_a1b2c3d4' },
                scanDate: { type: 'string', format: 'date-time' },
                scanType: { type: 'string', enum: ['comprehensive'] },
                status: { type: 'string', enum: ['completed', 'failed', 'in-progress'] },
                summary: {
                  type: 'object',
                  properties: {
                    critical: { type: 'number', example: 0 },
                    high: { type: 'number', example: 2 },
                    medium: { type: 'number', example: 8 },
                    low: { type: 'number', example: 15 },
                    info: { type: 'number', example: 5 },
                    total: { type: 'number', example: 30 }
                  }
                },
                complianceStatus: {
                  type: 'object',
                  properties: {
                    hipaa: { type: 'boolean', example: true },
                    sox: { type: 'boolean', example: true },
                    pci: { type: 'boolean', example: false },
                    gdpr: { type: 'boolean', example: true }
                  }
                }
              }
            },
            securityMetrics: {
              type: 'object',
              properties: {
                securityScore: { type: 'number', example: 85, description: 'Overall security score (0-100)' },
                threatLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium' },
                alertsActive: { type: 'number', example: 3 },
                remediationProgress: { type: 'number', example: 75, description: 'Percentage of issues resolved' }
              }
            },
            activeAlerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  title: { type: 'string' },
                  healthcareImpact: { type: 'string' },
                  complianceRisk: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            threatLevel: { type: 'string', example: 'medium' },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Update 2 high-severity dependencies',
                'Implement additional PHI data encryption',
                'Review and update access controls'
              ]
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            assessmentCompletedAt: { type: 'string', format: 'date-time' },
            scanDuration: { type: 'string', example: '2 minutes 34 seconds' },
            nextAssessmentDate: { type: 'string', format: 'date-time' },
            complianceNote: { type: 'string', example: 'Assessment performed in compliance with HIPAA audit requirements' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires admin or super_admin role'
  })
  @ApiResponse({
    status: 500,
    description: 'Security assessment failed - check logs for details'
  })
  async performSecurityAssessment(
    @Query() query: SecurityAssessmentQuery
  ) {
    const startTime = Date.now();
    
    try {
      await this.centralizedLogger.auditLog('Security assessment requested', {
        includeRecommendations: query.includeRecommendations,
        fullReport: query.fullReport,
        service: 'security-monitoring-controller'
      });

      const assessment = await this.securityMonitoringService.performSecurityAssessment();

      const response = {
        success: true,
        data: assessment,
        metadata: {
          assessmentCompletedAt: new Date().toISOString(),
          scanDuration: `${Math.round((Date.now() - startTime) / 1000)} seconds`,
          nextAssessmentDate: assessment.vulnerabilityReport.nextScanDate,
          complianceNote: 'Assessment performed in compliance with HIPAA audit requirements'
        }
      };

      await this.centralizedLogger.auditLog('Security assessment completed', {
        vulnerabilitiesFound: assessment.vulnerabilityReport.summary.total,
        threatLevel: assessment.threatLevel,
        securityScore: assessment.securityMetrics.securityScore,
        durationMs: Date.now() - startTime,
        service: 'security-monitoring-controller'
      });

      return response;

    } catch (error) {
      await this.centralizedLogger.auditLog('Security assessment failed', {
        error: error.message,
        durationMs: Date.now() - startTime,
        service: 'security-monitoring-controller'
      });
      throw error;
    }
  }

  /**
   * Get current security metrics and status
   * 
   * Returns real-time security metrics, threat level, and compliance status
   * for monitoring dashboards and automated systems.
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get current security metrics and status',
    description: `
    Returns comprehensive security metrics and status information:
    
    **Metrics Included:**
    - Current vulnerability counts by severity
    - Compliance status across all frameworks
    - Active security alerts and escalations
    - Overall security score and threat level
    - Remediation progress and next scan date
    
    **Use Cases:**
    - Security dashboard widgets and displays
    - Automated monitoring and alerting systems
    - Executive reporting and KPI tracking
    - Integration with SIEM and SOC tools
    - Health checks and status pages
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        vulnerabilityCount: {
          type: 'object',
          properties: {
            critical: { type: 'number', example: 0 },
            high: { type: 'number', example: 2 },
            medium: { type: 'number', example: 8 },
            low: { type: 'number', example: 15 },
            total: { type: 'number', example: 25 }
          }
        },
        complianceStatus: {
          type: 'object',
          properties: {
            hipaa: { type: 'boolean', example: true },
            sox: { type: 'boolean', example: true },
            pci: { type: 'boolean', example: false },
            gdpr: { type: 'boolean', example: true },
            overallScore: { type: 'number', example: 75, description: 'Overall compliance score (0-100)' }
          }
        },
        threatLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium' },
        securityScore: { type: 'number', example: 85, description: 'Overall security score (0-100)' },
        alertsActive: { type: 'number', example: 3 },
        remediationProgress: { type: 'number', example: 75, description: 'Percentage of issues resolved' }
      }
    }
  })
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return this.securityMonitoringService.getSecurityMetrics();
  }

  /**
   * Get active security alerts
   * 
   * Returns all active security alerts that require attention,
   * prioritized by severity and healthcare impact.
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get active security alerts',
    description: `
    Returns all active security alerts requiring attention:
    
    **Alert Information:**
    - Alert severity and type classification
    - Healthcare impact assessment
    - Affected systems and components
    - Compliance risk evaluation
    - Required actions and escalation status
    
    **Alert Types:**
    - Vulnerability alerts (critical, high, medium, low)
    - Compliance violations and gaps
    - Intrusion detection and anomalies
    - System security events and incidents
    
    **Healthcare Context:**
    - PHI data exposure risk assessment
    - Clinical workflow impact evaluation
    - Patient safety considerations
    - Regulatory compliance implications
    `
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    enum: ['critical', 'high', 'medium', 'low'],
    description: 'Filter alerts by severity level'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['vulnerability', 'compliance', 'intrusion', 'anomaly'],
    description: 'Filter alerts by type'
  })
  @ApiResponse({
    status: 200,
    description: 'Active security alerts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'alert_1704067200000_a1b2c3d4' },
          timestamp: { type: 'string', format: 'date-time' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          type: { type: 'string', enum: ['vulnerability', 'compliance', 'intrusion', 'anomaly'] },
          title: { type: 'string', example: 'Critical vulnerability in authentication system' },
          description: { type: 'string' },
          affectedSystems: { type: 'array', items: { type: 'string' } },
          healthcareImpact: { type: 'string', example: 'Potential PHI data exposure risk' },
          complianceRisk: { type: 'array', items: { type: 'string' }, example: ['HIPAA', 'SOX'] },
          actionRequired: { type: 'string' },
          escalated: { type: 'boolean' },
          assignedTo: { type: 'string', nullable: true }
        }
      }
    }
  })
  async getActiveAlerts(
    @Query('severity') severity?: string,
    @Query('type') type?: string
  ): Promise<SecurityAlert[]> {
    let alerts = this.securityMonitoringService.getActiveSecurityAlerts();

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get specific security alert details
   * 
   * Returns detailed information about a specific security alert
   * including full context, remediation steps, and audit trail.
   */
  @Get('alerts/:alertId')
  @ApiOperation({
    summary: 'Get specific security alert details',
    description: 'Returns detailed information about a specific security alert including full context and remediation steps'
  })
  @ApiParam({
    name: 'alertId',
    description: 'Unique identifier of the security alert',
    example: 'alert_1704067200000_a1b2c3d4'
  })
  @ApiResponse({
    status: 200,
    description: 'Security alert details retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Security alert not found'
  })
  async getSecurityAlert(@Param('alertId') alertId: string): Promise<SecurityAlert> {
    const alert = this.securityMonitoringService.getSecurityAlert(alertId);
    
    if (!alert) {
      throw new Error(`Security alert ${alertId} not found`);
    }

    return alert;
  }

  /**
   * Escalate security alert
   * 
   * Escalates a security alert to higher priority, assigns to security team,
   * and triggers additional notification procedures.
   */
  @Put('alerts/:alertId/escalate')
  @ApiOperation({
    summary: 'Escalate security alert',
    description: `
    Escalates a security alert to higher priority level:
    
    **Escalation Actions:**
    - Assigns alert to security team for immediate attention
    - Triggers additional notification channels (email, SMS, Slack)
    - Updates alert priority and tracking status
    - Logs escalation action for audit compliance
    
    **Use Cases:**
    - Critical vulnerabilities requiring immediate attention
    - PHI-related security incidents
    - Compliance violations with regulatory impact
    - System compromise or intrusion detection
    `
  })
  @ApiParam({
    name: 'alertId',
    description: 'Unique identifier of the security alert to escalate'
  })
  @ApiResponse({
    status: 200,
    description: 'Security alert escalated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Alert escalated successfully' },
        alert: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            escalated: { type: 'boolean', example: true },
            assignedTo: { type: 'string', example: 'security-team' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Security alert not found'
  })
  async escalateAlert(@Param('alertId') alertId: string) {
    await this.securityMonitoringService.escalateAlert(alertId);

    await this.centralizedLogger.auditLog('Security alert escalated', {
      alertId,
      escalatedBy: 'admin-user', // In production, get from JWT token
      service: 'security-monitoring-controller'
    });

    return {
      success: true,
      message: 'Alert escalated successfully',
      alert: this.securityMonitoringService.getSecurityAlert(alertId)
    };
  }

  /**
   * Resolve security alert
   * 
   * Marks a security alert as resolved with resolution details
   * and closes the incident tracking.
   */
  @Put('alerts/:alertId/resolve')
  @ApiOperation({
    summary: 'Resolve security alert',
    description: `
    Marks a security alert as resolved:
    
    **Resolution Process:**
    - Records resolution details and remediation actions taken
    - Updates alert status and completion timestamp
    - Logs resolution for compliance and audit purposes
    - Triggers post-incident review if required
    
    **Required Information:**
    - Resolution description and remediation steps
    - Assigned team member or responsible party
    - Verification of fix implementation
    `
  })
  @ApiParam({
    name: 'alertId',
    description: 'Unique identifier of the security alert to resolve'
  })
  @ApiResponse({
    status: 200,
    description: 'Security alert resolved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Security alert not found'
  })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() resolveDto: ResolveAlertDto
  ) {
    await this.securityMonitoringService.resolveAlert(alertId, resolveDto.resolution);

    await this.centralizedLogger.auditLog('Security alert resolved', {
      alertId,
      resolution: resolveDto.resolution,
      resolvedBy: resolveDto.assignedTo || 'admin-user',
      service: 'security-monitoring-controller'
    });

    return {
      success: true,
      message: 'Alert resolved successfully',
      alert: this.securityMonitoringService.getSecurityAlert(alertId)
    };
  }

  /**
   * Get security metrics history
   * 
   * Returns historical security metrics for trend analysis,
   * reporting, and compliance documentation.
   */
  @Get('metrics/history')
  @ApiOperation({
    summary: 'Get security metrics history',
    description: `
    Returns historical security metrics for trend analysis:
    
    **Historical Data:**
    - Security scores over time
    - Vulnerability counts and trends
    - Compliance status changes
    - Threat level fluctuations
    - Remediation progress tracking
    
    **Use Cases:**
    - Executive reporting and dashboards
    - Compliance audit documentation
    - Security posture trend analysis
    - Budget planning and resource allocation
    - Risk management reporting
    `
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days of history to retrieve (default: 30)',
    example: 30
  })
  @ApiResponse({
    status: 200,
    description: 'Security metrics history retrieved successfully'
  })
  async getMetricsHistory(@Query('days') days: number = 30): Promise<SecurityMetrics[]> {
    return this.securityMonitoringService.getMetricsHistory(days);
  }

  /**
   * Get current threat level
   * 
   * Returns the current threat level assessment based on
   * active vulnerabilities, alerts, and threat intelligence.
   */
  @Get('threat-level')
  @ApiOperation({
    summary: 'Get current threat level',
    description: `
    Returns the current threat level assessment:
    
    **Threat Levels:**
    - **Low**: Normal security posture, routine monitoring
    - **Medium**: Some security concerns, increased vigilance
    - **High**: Significant security risks, active monitoring required
    - **Critical**: Immediate security threats, emergency response needed
    
    **Assessment Factors:**
    - Active critical and high severity vulnerabilities
    - PHI-related security risks and exposures
    - Compliance violations and regulatory risks
    - Threat intelligence and active exploits
    - Healthcare-specific threat indicators
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Current threat level retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        threatLevel: { 
          type: 'string', 
          enum: ['low', 'medium', 'high', 'critical'],
          example: 'medium'
        },
        lastUpdated: { type: 'string', format: 'date-time' },
        factors: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '2 high-severity vulnerabilities detected',
            'PHI-related security risk identified',
            'HIPAA compliance gap detected'
          ]
        }
      }
    }
  })
  async getCurrentThreatLevel() {
    const threatLevel = this.securityMonitoringService.getCurrentThreatLevel();
    const metrics = this.securityMonitoringService.getSecurityMetrics();
    const activeAlerts = this.securityMonitoringService.getActiveSecurityAlerts();

    const factors = [];
    if (metrics.vulnerabilityCount.critical > 0) {
      factors.push(`${metrics.vulnerabilityCount.critical} critical vulnerabilities detected`);
    }
    if (metrics.vulnerabilityCount.high > 0) {
      factors.push(`${metrics.vulnerabilityCount.high} high-severity vulnerabilities detected`);
    }
    if (!metrics.complianceStatus.hipaa) {
      factors.push('HIPAA compliance gap detected');
    }
    if (activeAlerts.some(a => a.severity === 'critical')) {
      factors.push('Critical security alerts active');
    }

    return {
      threatLevel,
      lastUpdated: metrics.timestamp,
      factors: factors.length > 0 ? factors : ['No significant threats detected']
    };
  }
}