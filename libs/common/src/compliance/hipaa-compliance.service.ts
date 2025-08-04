import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';

export interface HIPAARule {
  ruleId: string;
  category: 'administrative' | 'physical' | 'technical';
  title: string;
  description: string;
  required: boolean;
  implementation: HIPAAImplementation;
  lastAssessed?: Date;
  complianceStatus: 'compliant' | 'non-compliant' | 'partially-compliant' | 'not-assessed';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  evidenceRequired: string[];
  automatedChecks: boolean;
}

export interface HIPAAImplementation {
  controls: string[];
  technologies: string[];
  policies: string[];
  procedures: string[];
  monitoring: string[];
  documentation: string[];
}

export interface PHIDataClassification {
  dataType: string;
  classification: 'phi' | 'pii' | 'public' | 'internal';
  encryptionRequired: boolean;
  accessControls: string[];
  retentionPeriod: string;
  auditRequired: boolean;
}

export interface HIPAAViolation {
  violationId: string;
  ruleId: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  detectedAt: Date;
  userId?: string;
  resourceAccessed?: string;
  remediation: {
    required: boolean;
    actions: string[];
    timeline: string;
    responsible: string[];
  };
  resolved: boolean;
  resolvedAt?: Date;
  evidence: string[];
}

export interface ComplianceAssessment {
  assessmentId: string;
  assessmentDate: Date;
  assessor: string;
  scope: string[];
  results: {
    totalRules: number;
    compliant: number;
    nonCompliant: number;
    partiallyCompliant: number;
    notAssessed: number;
    overallScore: number;
    riskScore: number;
  };
  findings: HIPAAViolation[];
  recommendations: string[];
  nextAssessmentDue: Date;
}

@Injectable()
export class HIPAAComplianceService {
  private readonly logger = new Logger(HIPAAComplianceService.name);
  private readonly hipaaRules = new Map<string, HIPAARule>();
  private readonly dataClassifications = new Map<string, PHIDataClassification>();
  private readonly violations: HIPAAViolation[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    this.initializeHIPAARules();
    this.initializePHIClassifications();
  }

  /**
   * Initialize HIPAA Security Rule requirements
   */
  private initializeHIPAARules(): void {
    const rules: HIPAARule[] = [
      // Administrative Safeguards
      {
        ruleId: 'ADMIN-001',
        category: 'administrative',
        title: 'Security Officer',
        description: 'Assign security responsibilities to an individual',
        required: true,
        implementation: {
          controls: ['designated_security_officer', 'security_responsibilities'],
          technologies: ['identity_management', 'role_based_access'],
          policies: ['security_policy', 'incident_response_policy'],
          procedures: ['security_officer_duties', 'security_incident_procedures'],
          monitoring: ['security_officer_activities', 'policy_compliance'],
          documentation: ['security_officer_designation', 'security_policies']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'high',
        evidenceRequired: ['security_officer_appointment', 'security_policies', 'training_records'],
        automatedChecks: false
      },
      {
        ruleId: 'ADMIN-002',
        category: 'administrative',
        title: 'Workforce Training',
        description: 'Implement workforce training and access management',
        required: true,
        implementation: {
          controls: ['workforce_access_management', 'training_programs'],
          technologies: ['learning_management_system', 'access_provisioning'],
          policies: ['workforce_security_policy', 'training_policy'],
          procedures: ['user_provisioning', 'training_procedures'],
          monitoring: ['training_completion', 'access_reviews'],
          documentation: ['training_records', 'access_management_procedures']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'medium',
        evidenceRequired: ['training_completion_records', 'access_review_reports'],
        automatedChecks: true
      },
      {
        ruleId: 'ADMIN-003',
        category: 'administrative',
        title: 'Contingency Plan',
        description: 'Establish procedures for responding to emergencies',
        required: true,
        implementation: {
          controls: ['business_continuity_plan', 'disaster_recovery'],
          technologies: ['backup_systems', 'failover_mechanisms'],
          policies: ['contingency_policy', 'emergency_response_policy'],
          procedures: ['backup_procedures', 'recovery_procedures'],
          monitoring: ['backup_monitoring', 'recovery_testing'],
          documentation: ['contingency_plan', 'recovery_procedures']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'critical',
        evidenceRequired: ['contingency_plan', 'recovery_test_results', 'backup_logs'],
        automatedChecks: true
      },

      // Physical Safeguards
      {
        ruleId: 'PHYS-001',
        category: 'physical',
        title: 'Facility Access Controls',
        description: 'Limit physical access to facilities and workstations',
        required: true,
        implementation: {
          controls: ['facility_access_controls', 'workstation_security'],
          technologies: ['physical_access_systems', 'surveillance_systems'],
          policies: ['facility_access_policy', 'workstation_policy'],
          procedures: ['access_control_procedures', 'visitor_management'],
          monitoring: ['access_logs', 'security_monitoring'],
          documentation: ['access_control_procedures', 'facility_security_plan']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'medium',
        evidenceRequired: ['access_control_logs', 'security_assessments'],
        automatedChecks: false
      },
      {
        ruleId: 'PHYS-002',
        category: 'physical',
        title: 'Workstation Use',
        description: 'Implement controls for workstation use',
        required: true,
        implementation: {
          controls: ['workstation_controls', 'device_management'],
          technologies: ['endpoint_protection', 'device_encryption'],
          policies: ['workstation_use_policy', 'device_policy'],
          procedures: ['workstation_setup', 'device_management'],
          monitoring: ['device_compliance', 'usage_monitoring'],
          documentation: ['workstation_procedures', 'device_inventory']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'medium',
        evidenceRequired: ['device_inventory', 'compliance_reports'],
        automatedChecks: true
      },

      // Technical Safeguards
      {
        ruleId: 'TECH-001',
        category: 'technical',
        title: 'Access Control',
        description: 'Implement technical access controls for PHI',
        required: true,
        implementation: {
          controls: ['unique_user_identification', 'emergency_access', 'automatic_logoff'],
          technologies: ['identity_management', 'mfa', 'session_management'],
          policies: ['access_control_policy', 'authentication_policy'],
          procedures: ['user_provisioning', 'access_reviews'],
          monitoring: ['access_monitoring', 'failed_login_attempts'],
          documentation: ['access_control_procedures', 'authentication_standards']
        },
        complianceStatus: 'partially-compliant',
        riskLevel: 'high',
        evidenceRequired: ['access_control_matrix', 'authentication_logs'],
        automatedChecks: true
      },
      {
        ruleId: 'TECH-002',
        category: 'technical',
        title: 'Audit Controls',
        description: 'Implement audit controls for PHI access',
        required: true,
        implementation: {
          controls: ['audit_logging', 'log_monitoring', 'audit_review'],
          technologies: ['logging_systems', 'siem', 'log_analysis'],
          policies: ['audit_policy', 'log_management_policy'],
          procedures: ['audit_procedures', 'log_review_procedures'],
          monitoring: ['audit_log_monitoring', 'compliance_monitoring'],
          documentation: ['audit_procedures', 'log_management_standards']
        },
        complianceStatus: 'compliant',
        riskLevel: 'high',
        evidenceRequired: ['audit_logs', 'log_review_reports'],
        automatedChecks: true
      },
      {
        ruleId: 'TECH-003',
        category: 'technical',
        title: 'Integrity Controls',
        description: 'Protect PHI from improper alteration or destruction',
        required: true,
        implementation: {
          controls: ['data_integrity_controls', 'version_control', 'change_management'],
          technologies: ['data_validation', 'checksums', 'digital_signatures'],
          policies: ['data_integrity_policy', 'change_management_policy'],
          procedures: ['data_integrity_procedures', 'change_control_procedures'],
          monitoring: ['integrity_monitoring', 'change_monitoring'],
          documentation: ['integrity_procedures', 'change_management_standards']
        },
        complianceStatus: 'not-assessed',
        riskLevel: 'high',
        evidenceRequired: ['integrity_test_results', 'change_logs'],
        automatedChecks: true
      },
      {
        ruleId: 'TECH-004',
        category: 'technical',
        title: 'Transmission Security',
        description: 'Protect PHI during electronic transmission',
        required: true,
        implementation: {
          controls: ['encryption_in_transit', 'secure_protocols', 'network_security'],
          technologies: ['tls_ssl', 'vpn', 'secure_email'],
          policies: ['transmission_security_policy', 'encryption_policy'],
          procedures: ['secure_transmission_procedures', 'encryption_procedures'],
          monitoring: ['transmission_monitoring', 'encryption_compliance'],
          documentation: ['transmission_security_standards', 'encryption_standards']
        },
        complianceStatus: 'partially-compliant',
        riskLevel: 'critical',
        evidenceRequired: ['encryption_certificates', 'transmission_logs'],
        automatedChecks: true
      }
    ];

    rules.forEach(rule => {
      this.hipaaRules.set(rule.ruleId, rule);
    });

    this.centralizedLogger.info('HIPAA rules initialized', {
      totalRules: rules.length,
      service: 'hipaa-compliance',
      action: 'rules_initialized'
    });
  }

  /**
   * Initialize PHI data classifications
   */
  private initializePHIClassifications(): void {
    const classifications: PHIDataClassification[] = [
      {
        dataType: 'patient_demographics',
        classification: 'phi',
        encryptionRequired: true,
        accessControls: ['mfa_required', 'role_based_access', 'audit_logging'],
        retentionPeriod: '7_years',
        auditRequired: true
      },
      {
        dataType: 'medical_records',
        classification: 'phi',
        encryptionRequired: true,
        accessControls: ['mfa_required', 'healthcare_role_required', 'audit_logging'],
        retentionPeriod: '7_years',
        auditRequired: true
      },
      {
        dataType: 'financial_information',
        classification: 'pii',
        encryptionRequired: true,
        accessControls: ['mfa_required', 'billing_role_required', 'audit_logging'],
        retentionPeriod: '7_years',
        auditRequired: true
      },
      {
        dataType: 'appointment_data',
        classification: 'phi',
        encryptionRequired: true,
        accessControls: ['authentication_required', 'role_based_access'],
        retentionPeriod: '7_years',
        auditRequired: true
      },
      {
        dataType: 'system_logs',
        classification: 'internal',
        encryptionRequired: false,
        accessControls: ['admin_access_required'],
        retentionPeriod: '3_years',
        auditRequired: false
      },
      {
        dataType: 'public_content',
        classification: 'public',
        encryptionRequired: false,
        accessControls: [],
        retentionPeriod: '1_year',
        auditRequired: false
      }
    ];

    classifications.forEach(classification => {
      this.dataClassifications.set(classification.dataType, classification);
    });

    this.centralizedLogger.info('PHI data classifications initialized', {
      totalClassifications: classifications.length,
      service: 'hipaa-compliance',
      action: 'classifications_initialized'
    });
  }

  /**
   * Assess compliance with HIPAA rules
   */
  async assessCompliance(assessor: string, scope?: string[]): Promise<ComplianceAssessment> {
    const assessmentId = `HIPAA-ASSESS-${Date.now()}`;
    const assessmentDate = new Date();
    
    const rulesToAssess = scope ? 
      Array.from(this.hipaaRules.values()).filter(rule => scope.includes(rule.ruleId)) :
      Array.from(this.hipaaRules.values());

    const results = {
      totalRules: rulesToAssess.length,
      compliant: rulesToAssess.filter(r => r.complianceStatus === 'compliant').length,
      nonCompliant: rulesToAssess.filter(r => r.complianceStatus === 'non-compliant').length,
      partiallyCompliant: rulesToAssess.filter(r => r.complianceStatus === 'partially-compliant').length,
      notAssessed: rulesToAssess.filter(r => r.complianceStatus === 'not-assessed').length,
      overallScore: 0,
      riskScore: 0
    };

    // Calculate overall compliance score
    const weightedScore = (results.compliant * 100) + (results.partiallyCompliant * 50);
    results.overallScore = Math.round(weightedScore / results.totalRules);

    // Calculate risk score based on critical/high risk non-compliant rules
    const highRiskNonCompliant = rulesToAssess.filter(r => 
      r.complianceStatus === 'non-compliant' && ['critical', 'high'].includes(r.riskLevel)
    ).length;
    results.riskScore = Math.min(100, highRiskNonCompliant * 20);

    const assessment: ComplianceAssessment = {
      assessmentId,
      assessmentDate,
      assessor,
      scope: scope || ['all'],
      results,
      findings: this.violations.filter(v => 
        scope ? scope.includes(v.ruleId) : true
      ),
      recommendations: this.generateRecommendations(rulesToAssess),
      nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    this.centralizedLogger.auditLog('HIPAA compliance assessment completed', {
      assessmentId,
      assessor,
      overallScore: results.overallScore,
      riskScore: results.riskScore,
      nonCompliantRules: results.nonCompliant,
      service: 'hipaa-compliance',
      action: 'compliance_assessment',
      hipaaRelevant: true,
      auditRequired: true
    });

    return assessment;
  }

  /**
   * Report HIPAA violation
   */
  async reportViolation(
    ruleId: string,
    description: string,
    severity: 'minor' | 'major' | 'critical',
    context?: HealthcareLogContext
  ): Promise<string> {
    const violationId = `HIPAA-VIO-${Date.now()}`;
    const rule = this.hipaaRules.get(ruleId);

    if (!rule) {
      throw new Error(`Unknown HIPAA rule: ${ruleId}`);
    }

    const violation: HIPAAViolation = {
      violationId,
      ruleId,
      severity,
      description,
      detectedAt: new Date(),
      userId: context?.userId,
      resourceAccessed: context?.resourceId,
      remediation: {
        required: severity !== 'minor',
        actions: this.getRemediationActions(ruleId, severity),
        timeline: this.getRemediationTimeline(severity),
        responsible: this.getResponsibleParties(ruleId)
      },
      resolved: false,
      evidence: []
    };

    this.violations.push(violation);

    // Update rule compliance status
    if (severity === 'critical') {
      rule.complianceStatus = 'non-compliant';
    } else if (severity === 'major' && rule.complianceStatus === 'compliant') {
      rule.complianceStatus = 'partially-compliant';
    }

    this.centralizedLogger.securityLog('HIPAA violation reported', {
      violationId,
      ruleId,
      severity,
      description,
      userId: context?.userId,
      resourceAccessed: context?.resourceId,
      service: 'hipaa-compliance',
      action: 'violation_reported',
      alertLevel: severity === 'critical' ? 'critical' : 'high',
      hipaaRelevant: true,
      auditRequired: true
    });

    // Trigger immediate notification for critical violations
    if (severity === 'critical') {
      await this.notifyCriticalViolation(violation);
    }

    return violationId;
  }

  /**
   * Validate PHI access compliance
   */
  async validatePHIAccess(
    dataType: string,
    userId: string,
    context: HealthcareLogContext
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const classification = this.dataClassifications.get(dataType);
    if (!classification) {
      return { compliant: false, violations: ['Unknown data type'] };
    }

    const violations: string[] = [];

    // Check if PHI/PII data
    if (['phi', 'pii'].includes(classification.classification)) {
      // Verify MFA if required
      if (classification.accessControls.includes('mfa_required')) {
        const mfaVerified = context.mfaVerified || false;
        if (!mfaVerified) {
          violations.push('MFA verification required for PHI access');
        }
      }

      // Verify role-based access
      if (classification.accessControls.includes('role_based_access')) {
        // This would check user roles in real implementation
        const hasRequiredRole = true; // Placeholder
        if (!hasRequiredRole) {
          violations.push('Insufficient role privileges for data access');
        }
      }

      // Log PHI access
      if (classification.auditRequired) {
        this.centralizedLogger.auditLog('PHI data accessed', {
          dataType,
          userId,
          classification: classification.classification,
          encryptionRequired: classification.encryptionRequired,
          service: 'hipaa-compliance',
          action: 'phi_access',
          hipaaRelevant: true,
          auditRequired: true,
          ...context
        });
      }
    }

    const compliant = violations.length === 0;

    if (!compliant) {
      await this.reportViolation(
        'TECH-001',
        `PHI access violation: ${violations.join(', ')}`,
        'major',
        context
      );
    }

    return { compliant, violations };
  }

  /**
   * Get PHI data classification
   */
  getPHIClassification(dataType: string): PHIDataClassification | null {
    return this.dataClassifications.get(dataType) || null;
  }

  /**
   * Get all HIPAA rules
   */
  getHIPAARules(): HIPAARule[] {
    return Array.from(this.hipaaRules.values());
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(): Promise<{
    overallCompliance: number;
    ruleStatus: Record<string, number>;
    recentViolations: HIPAAViolation[];
    criticalFindings: number;
    nextAssessmentDue: Date;
  }> {
    const rules = Array.from(this.hipaaRules.values());
    const ruleStatus = {
      compliant: rules.filter(r => r.complianceStatus === 'compliant').length,
      nonCompliant: rules.filter(r => r.complianceStatus === 'non-compliant').length,
      partiallyCompliant: rules.filter(r => r.complianceStatus === 'partially-compliant').length,
      notAssessed: rules.filter(r => r.complianceStatus === 'not-assessed').length
    };

    const overallCompliance = Math.round(
      ((ruleStatus.compliant * 100) + (ruleStatus.partiallyCompliant * 50)) / rules.length
    );

    const recentViolations = this.violations
      .filter(v => v.detectedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 10);

    const criticalFindings = this.violations.filter(v => 
      v.severity === 'critical' && !v.resolved
    ).length;

    return {
      overallCompliance,
      ruleStatus,
      recentViolations,
      criticalFindings,
      nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Health check for HIPAA compliance service
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const dashboard = await this.getComplianceDashboard();
      const criticalViolations = this.violations.filter(v => 
        v.severity === 'critical' && !v.resolved
      ).length;

      const status = criticalViolations > 0 ? 'critical' : 
                    dashboard.overallCompliance < 80 ? 'warning' : 'healthy';

      return {
        status,
        details: {
          overallCompliance: `${dashboard.overallCompliance}%`,
          criticalViolations,
          totalRules: this.hipaaRules.size,
          dataClassifications: this.dataClassifications.size,
          recentViolations: dashboard.recentViolations.length,
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

  private generateRecommendations(rules: HIPAARule[]): string[] {
    const recommendations: string[] = [];
    
    const nonCompliantRules = rules.filter(r => r.complianceStatus === 'non-compliant');
    const partiallyCompliantRules = rules.filter(r => r.complianceStatus === 'partially-compliant');
    const notAssessedRules = rules.filter(r => r.complianceStatus === 'not-assessed');

    if (nonCompliantRules.length > 0) {
      recommendations.push(`Immediately address ${nonCompliantRules.length} non-compliant rules`);
    }

    if (partiallyCompliantRules.length > 0) {
      recommendations.push(`Improve implementation of ${partiallyCompliantRules.length} partially compliant rules`);
    }

    if (notAssessedRules.length > 0) {
      recommendations.push(`Conduct assessment for ${notAssessedRules.length} unassessed rules`);
    }

    recommendations.push('Implement automated compliance monitoring');
    recommendations.push('Conduct regular workforce training on HIPAA requirements');
    recommendations.push('Establish incident response procedures for violations');

    return recommendations;
  }

  private getRemediationActions(ruleId: string, severity: string): string[] {
    const baseActions = [
      'Document the incident',
      'Assess the scope of impact',
      'Implement immediate containment measures'
    ];

    if (severity === 'critical') {
      baseActions.push(
        'Notify affected individuals within 60 days',
        'Report to HHS within 60 days',
        'Conduct thorough risk assessment',
        'Implement additional safeguards'
      );
    }

    return baseActions;
  }

  private getRemediationTimeline(severity: string): string {
    switch (severity) {
      case 'critical': return '24 hours';
      case 'major': return '72 hours';
      case 'minor': return '7 days';
      default: return '7 days';
    }
  }

  private getResponsibleParties(ruleId: string): string[] {
    return [
      'Security Officer',
      'Privacy Officer',
      'IT Administrator',
      'Compliance Team'
    ];
  }

  private async notifyCriticalViolation(violation: HIPAAViolation): Promise<void> {
    // In production, this would send notifications to security team,
    // privacy officer, and other stakeholders
    this.centralizedLogger.securityLog('Critical HIPAA violation - immediate attention required', {
      violationId: violation.violationId,
      ruleId: violation.ruleId,
      description: violation.description,
      service: 'hipaa-compliance',
      alertLevel: 'critical',
      requiresNotification: true
    });
  }
}