/**
 * Compliance module exports
 * 
 * Comprehensive HIPAA compliance framework with PHI data handling,
 * audit trails, and automated compliance monitoring for healthcare platforms.
 */

// Core services
export * from './hipaa-compliance.service';
export * from './phi-data-handler.service';
export * from './compliance-audit.service';
export * from './compliance.module';

// Type definitions
export type {
  HIPAARule,
  HIPAAImplementation,
  PHIDataClassification,
  HIPAAViolation,
  ComplianceAssessment
} from './hipaa-compliance.service';

export type {
  PHIDataRequest,
  PHIAccessControl,
  PHIAuditEntry,
  DataMinimization,
  ConsentManagement
} from './phi-data-handler.service';

export type {
  AuditEvent,
  AuditEventType,
  AuditQuery,
  AuditReport,
  AuditFinding,
  ComplianceMetrics
} from './compliance-audit.service';

// Utility functions and constants
export const ComplianceFrameworks = {
  HIPAA: 'HIPAA',
  HITECH: 'HITECH',
  SOC2: 'SOC2',
  GDPR: 'GDPR',
  ISO27001: 'ISO27001',
  NIST: 'NIST'
} as const;

export const PHIDataTypes = {
  PATIENT_DEMOGRAPHICS: 'patient_demographics',
  MEDICAL_RECORDS: 'medical_records',
  FINANCIAL_INFORMATION: 'financial_information',
  APPOINTMENT_DATA: 'appointment_data',
  PRESCRIPTION_DATA: 'prescription_data',
  INSURANCE_INFORMATION: 'insurance_information'
} as const;

export const AuditEventTypes = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  DATA_EXPORT: 'data_export',
  SYSTEM_ACCESS: 'system_access',
  CONFIGURATION_CHANGE: 'configuration_change',
  SECURITY_EVENT: 'security_event',
  PRIVACY_EVENT: 'privacy_event',
  CONSENT_MANAGEMENT: 'consent_management',
  BREACH_INCIDENT: 'breach_incident',
  POLICY_VIOLATION: 'policy_violation'
} as const;

// Compliance utilities
export const ComplianceUtils = {
  /**
   * Check if data type requires HIPAA protection
   */
  isHIPAAProtected: (dataType: string): boolean => {
    const protectedTypes = [
      PHIDataTypes.PATIENT_DEMOGRAPHICS,
      PHIDataTypes.MEDICAL_RECORDS,
      PHIDataTypes.APPOINTMENT_DATA,
      PHIDataTypes.PRESCRIPTION_DATA,
      PHIDataTypes.INSURANCE_INFORMATION
    ];
    return protectedTypes.includes(dataType as any);
  },

  /**
   * Get required retention period for data type
   */
  getRetentionPeriod: (dataType: string): number => {
    const retentionMap = {
      [PHIDataTypes.MEDICAL_RECORDS]: 7 * 365, // 7 years
      [PHIDataTypes.FINANCIAL_INFORMATION]: 7 * 365, // 7 years
      [PHIDataTypes.PATIENT_DEMOGRAPHICS]: 7 * 365, // 7 years
      [PHIDataTypes.APPOINTMENT_DATA]: 7 * 365, // 7 years
      [PHIDataTypes.PRESCRIPTION_DATA]: 7 * 365, // 7 years
      'system_logs': 3 * 365, // 3 years
      'audit_logs': 7 * 365, // 7 years
      'public_content': 1 * 365 // 1 year
    };
    return retentionMap[dataType] || 3 * 365; // Default 3 years
  },

  /**
   * Determine if MFA is required for data access
   */
  requiresMFA: (dataType: string, operation: string): boolean => {
    if (ComplianceUtils.isHIPAAProtected(dataType)) {
      return true;
    }
    
    const sensitiveOperations = ['export', 'delete', 'modify', 'bulk_access'];
    return sensitiveOperations.includes(operation);
  },

  /**
   * Get compliance frameworks applicable to data type
   */
  getApplicableFrameworks: (dataType: string): string[] => {
    const frameworks = [ComplianceFrameworks.SOC2]; // Always applicable
    
    if (ComplianceUtils.isHIPAAProtected(dataType)) {
      frameworks.push(ComplianceFrameworks.HIPAA, ComplianceFrameworks.HITECH);
    }
    
    frameworks.push(ComplianceFrameworks.ISO27001); // Security framework
    
    return frameworks;
  },

  /**
   * Calculate compliance score based on violations
   */
  calculateComplianceScore: (
    totalEvents: number,
    violations: number,
    criticalViolations: number
  ): number => {
    if (totalEvents === 0) return 100;
    
    const violationRate = violations / totalEvents;
    const criticalRate = criticalViolations / totalEvents;
    
    // Base score minus violations, with critical violations counting double
    const score = 100 - (violationRate * 50) - (criticalRate * 30);
    return Math.max(0, Math.round(score));
  },

  /**
   * Validate PHI field access permissions
   */
  validateFieldAccess: (
    userRoles: string[],
    dataType: string,
    fieldName: string
  ): boolean => {
    const restrictedFields = {
      [PHIDataTypes.PATIENT_DEMOGRAPHICS]: {
        'ssn': ['admin', 'billing'],
        'insurance_id': ['admin', 'billing', 'insurance_specialist'],
        'emergency_contact': ['healthcare_provider', 'nurse', 'admin']
      },
      [PHIDataTypes.MEDICAL_RECORDS]: {
        'diagnosis': ['healthcare_provider', 'doctor', 'nurse'],
        'medication': ['healthcare_provider', 'doctor', 'pharmacist'],
        'lab_results': ['healthcare_provider', 'doctor', 'lab_technician']
      }
    };

    const fieldRestrictions = restrictedFields[dataType]?.[fieldName];
    if (!fieldRestrictions) return true; // No restrictions

    return userRoles.some(role => fieldRestrictions.includes(role));
  }
};

// HIPAA Rule constants
export const HIPAARules = {
  // Administrative Safeguards
  SECURITY_OFFICER: 'ADMIN-001',
  WORKFORCE_TRAINING: 'ADMIN-002',
  CONTINGENCY_PLAN: 'ADMIN-003',
  INFORMATION_SYSTEM_REVIEW: 'ADMIN-004',

  // Physical Safeguards
  FACILITY_ACCESS: 'PHYS-001',
  WORKSTATION_USE: 'PHYS-002',
  DEVICE_CONTROLS: 'PHYS-003',

  // Technical Safeguards
  ACCESS_CONTROL: 'TECH-001',
  AUDIT_CONTROLS: 'TECH-002',
  INTEGRITY_CONTROLS: 'TECH-003',
  TRANSMISSION_SECURITY: 'TECH-004',
  PERSON_AUTHENTICATION: 'TECH-005'
} as const;

// Consent types
export const ConsentTypes = {
  TREATMENT: 'treatment',
  PAYMENT: 'payment',
  OPERATIONS: 'operations',
  RESEARCH: 'research',
  MARKETING: 'marketing',
  DISCLOSURE: 'disclosure'
} as const;

// Severity levels
export const SeverityLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

// Compliance decorator utilities
export const ComplianceDecorators = {
  /**
   * Mark method as requiring HIPAA audit logging
   */
  HIPAAAuditRequired: () => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('hipaa_audit_required', true);
  },

  /**
   * Mark method as handling PHI data
   */
  PHIDataHandler: (dataType: string) => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('phi_data_type', dataType);
  },

  /**
   * Mark method as requiring consent validation
   */
  ConsentRequired: (consentType: string) => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('consent_required', consentType);
  },

  /**
   * Mark method as requiring data minimization
   */
  DataMinimization: (allowedFields: string[]) => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('allowed_fields', allowedFields);
  }
};

// Default configurations
export const DefaultComplianceConfig = {
  AUDIT_RETENTION_DAYS: 2555, // 7 years
  PHI_SESSION_TIMEOUT: 1800, // 30 minutes
  MFA_REQUIRED_FOR_PHI: true,
  AUTOMATIC_ENCRYPTION: true,
  CONSENT_REQUIRED_FOR_RESEARCH: true,
  AUDIT_ALL_PHI_ACCESS: true,
  COMPLIANCE_FRAMEWORKS: ['HIPAA', 'SOC2'],
  VIOLATION_ALERT_SEVERITY: 'high'
};

// Error messages
export const ComplianceErrors = {
  PHI_ACCESS_DENIED: 'Access to PHI data denied due to compliance requirements',
  MFA_REQUIRED: 'Multi-factor authentication required for PHI access',
  CONSENT_REQUIRED: 'Patient consent required for this operation',
  AUDIT_FAILURE: 'Failed to create required audit trail',
  ENCRYPTION_REQUIRED: 'Data encryption required for PHI storage',
  RETENTION_VIOLATION: 'Data retention policy violation',
  UNAUTHORIZED_EXPORT: 'Unauthorized attempt to export PHI data'
};

// Compliance check functions
export const ComplianceChecks = {
  /**
   * Validate if user can access specific PHI data
   */
  validatePHIAccess: async (
    userId: string,
    dataType: string,
    operation: string,
    userRoles: string[],
    mfaVerified: boolean
  ): Promise<{ allowed: boolean; reason?: string }> => {
    // Check if PHI data
    if (!ComplianceUtils.isHIPAAProtected(dataType)) {
      return { allowed: true };
    }

    // Check MFA requirement
    if (ComplianceUtils.requiresMFA(dataType, operation) && !mfaVerified) {
      return { allowed: false, reason: ComplianceErrors.MFA_REQUIRED };
    }

    // Check role-based access
    const hasValidRole = userRoles.some(role => 
      ['healthcare_provider', 'doctor', 'nurse', 'admin'].includes(role)
    );

    if (!hasValidRole) {
      return { allowed: false, reason: ComplianceErrors.PHI_ACCESS_DENIED };
    }

    return { allowed: true };
  },

  /**
   * Check if operation requires audit logging
   */
  requiresAuditLogging: (dataType: string, operation: string): boolean => {
    return ComplianceUtils.isHIPAAProtected(dataType) || 
           ['export', 'delete', 'modify', 'admin'].includes(operation);
  },

  /**
   * Validate data retention compliance
   */
  validateRetention: (dataType: string, createdAt: Date): {
    compliant: boolean;
    retentionDate: Date;
    daysRemaining: number;
  } => {
    const retentionDays = ComplianceUtils.getRetentionPeriod(dataType);
    const retentionDate = new Date(createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((retentionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      compliant: now < retentionDate,
      retentionDate,
      daysRemaining: Math.max(0, daysRemaining)
    };
  }
};

// Compliance reporting utilities
export const ComplianceReporting = {
  /**
   * Generate standard HIPAA compliance report structure
   */
  generateHIPAAReport: (
    assessment: ComplianceAssessment,
    auditEvents: AuditEvent[],
    violations: HIPAAViolation[]
  ) => ({
    executiveSummary: {
      overallScore: assessment.results.overallScore,
      criticalFindings: violations.filter(v => v.severity === 'critical').length,
      recommendedActions: assessment.recommendations.slice(0, 5)
    },
    administrativeSafeguards: {
      rules: assessment.findings.filter(f => f.category === 'administrative'),
      compliance: 'compliant' // Would be calculated
    },
    physicalSafeguards: {
      rules: assessment.findings.filter(f => f.category === 'physical'),
      compliance: 'partially-compliant'
    },
    technicalSafeguards: {
      rules: assessment.findings.filter(f => f.category === 'technical'),
      compliance: 'compliant'
    },
    auditSummary: {
      totalEvents: auditEvents.length,
      phiAccess: auditEvents.filter(e => e.hipaaRelevant).length,
      violations: violations.length
    }
  })
};