/**
 * Compliance module exports
 *
 * Comprehensive compliance framework with data handling,
 * audit trails, and automated compliance monitoring for coaching platforms.
 */

// Core services
export * from './phi-data-handler.service';
export * from './compliance-audit.service';

// Import types for internal use
import type { AuditEvent } from './compliance-audit.service';
export * from './compliance.module';

// Stub types for backwards compatibility (deprecated - use ComplianceAuditService instead)
export interface HIPAAViolation {
  violationId: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  timestamp: Date;
}

export interface ComplianceAssessment {
  assessmentId: string;
  assessmentDate: Date;
  overallScore: number;
  findings: Array<{
    rule: string;
    compliant: boolean;
    description: string;
  }>;
  recommendations: string[];
  results: {
    overallScore: number;
  };
}

// Stub service class (deprecated - for backwards compatibility only)
// @Injectable decorator can't be used here as it's in index.ts
// Controllers should migrate to using ComplianceAuditService
export class HIPAAComplianceService {
  async assessCompliance(_userId: string, _scope?: string[]): Promise<ComplianceAssessment> {
    return {
      assessmentId: 'assessment-' + Date.now(),
      assessmentDate: new Date(),
      overallScore: 85,
      findings: [],
      recommendations: [],
      results: { overallScore: 85 }
    };
  }

  async validatePHIAccess(_dataType: string, _userId: string, _context: any): Promise<{ compliant: boolean; violations: string[] }> {
    return { compliant: true, violations: [] };
  }

  async reportViolation(_rule: string, _description: string, _severity: string, _context: any): Promise<string> {
    return 'violation-' + Date.now();
  }

  // Add stub methods that might be called
  async getViolations(_filter: any): Promise<HIPAAViolation[]> {
    return [];
  }

  async updateViolationStatus(_id: string, _status: string): Promise<void> {
    // Stub implementation
  }
}

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
  GDPR: 'GDPR',
  SOC2: 'SOC2',
  ISO27001: 'ISO27001',
  NIST: 'NIST'
} as const;

export const SensitiveDataTypes = {
  CLIENT_DEMOGRAPHICS: 'client_demographics',
  SESSION_NOTES: 'session_notes',
  FINANCIAL_INFORMATION: 'financial_information',
  APPOINTMENT_DATA: 'appointment_data',
  PROGRESS_RECORDS: 'progress_records',
  PAYMENT_INFORMATION: 'payment_information'
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
   * Check if data type requires enhanced protection
   */
  isSensitiveData: (dataType: string): boolean => {
    const protectedTypes = [
      SensitiveDataTypes.CLIENT_DEMOGRAPHICS,
      SensitiveDataTypes.SESSION_NOTES,
      SensitiveDataTypes.APPOINTMENT_DATA,
      SensitiveDataTypes.PROGRESS_RECORDS,
      SensitiveDataTypes.PAYMENT_INFORMATION
    ];
    return protectedTypes.includes(dataType as any);
  },

  /**
   * Get required retention period for data type
   */
  getRetentionPeriod: (dataType: string): number => {
    const retentionMap = {
      [SensitiveDataTypes.SESSION_NOTES]: 7 * 365, // 7 years
      [SensitiveDataTypes.FINANCIAL_INFORMATION]: 7 * 365, // 7 years
      [SensitiveDataTypes.CLIENT_DEMOGRAPHICS]: 7 * 365, // 7 years
      [SensitiveDataTypes.APPOINTMENT_DATA]: 7 * 365, // 7 years
      [SensitiveDataTypes.PROGRESS_RECORDS]: 7 * 365, // 7 years
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
    if (ComplianceUtils.isSensitiveData(dataType)) {
      return true;
    }

    const sensitiveOperations = ['export', 'delete', 'modify', 'bulk_access'];
    return sensitiveOperations.includes(operation);
  },

  /**
   * Get compliance frameworks applicable to data type
   */
  getApplicableFrameworks: (dataType: string): string[] => {
    const frameworks: string[] = [ComplianceFrameworks.SOC2]; // Always applicable

    if (ComplianceUtils.isSensitiveData(dataType)) {
      frameworks.push(ComplianceFrameworks.GDPR);
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
   * Validate sensitive field access permissions
   */
  validateFieldAccess: (
    userRoles: string[],
    dataType: string,
    fieldName: string
  ): boolean => {
    const restrictedFields = {
      [SensitiveDataTypes.CLIENT_DEMOGRAPHICS]: {
        'ssn': ['admin', 'billing'],
        'payment_info': ['admin', 'billing'],
        'emergency_contact': ['coach', 'admin']
      },
      [SensitiveDataTypes.SESSION_NOTES]: {
        'private_notes': ['coach', 'admin'],
        'goals': ['coach', 'admin'],
        'assessments': ['coach', 'admin']
      }
    };

    const fieldRestrictions = restrictedFields[dataType]?.[fieldName];
    if (!fieldRestrictions) return true; // No restrictions

    return userRoles.some(role => fieldRestrictions.includes(role));
  }
};

// Security and Compliance Rule constants
export const ComplianceRules = {
  // Administrative Controls
  SECURITY_OFFICER: 'ADMIN-001',
  WORKFORCE_TRAINING: 'ADMIN-002',
  CONTINGENCY_PLAN: 'ADMIN-003',
  INFORMATION_SYSTEM_REVIEW: 'ADMIN-004',

  // Physical Controls
  FACILITY_ACCESS: 'PHYS-001',
  WORKSTATION_USE: 'PHYS-002',
  DEVICE_CONTROLS: 'PHYS-003',

  // Technical Controls
  ACCESS_CONTROL: 'TECH-001',
  AUDIT_CONTROLS: 'TECH-002',
  INTEGRITY_CONTROLS: 'TECH-003',
  TRANSMISSION_SECURITY: 'TECH-004',
  PERSON_AUTHENTICATION: 'TECH-005'
} as const;

// Consent types
export const ConsentTypes = {
  COACHING_SESSIONS: 'coaching_sessions',
  PAYMENT: 'payment',
  OPERATIONS: 'operations',
  RESEARCH: 'research',
  MARKETING: 'marketing',
  DISCLOSURE: 'disclosure',
  DATA_PROCESSING: 'data_processing'
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
   * Mark method as requiring compliance audit logging
   */
  AuditRequired: () => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('audit_required', true);
  },

  /**
   * Mark method as handling sensitive data
   */
  SensitiveDataHandler: (dataType: string) => {
    const SetMetadata = require('@nestjs/common').SetMetadata;
    return SetMetadata('sensitive_data_type', dataType);
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
  SENSITIVE_DATA_SESSION_TIMEOUT: 1800, // 30 minutes
  MFA_REQUIRED_FOR_SENSITIVE_DATA: true,
  AUTOMATIC_ENCRYPTION: true,
  CONSENT_REQUIRED_FOR_RESEARCH: true,
  AUDIT_ALL_SENSITIVE_ACCESS: true,
  COMPLIANCE_FRAMEWORKS: ['GDPR', 'SOC2'],
  VIOLATION_ALERT_SEVERITY: 'high'
};

// Error messages
export const ComplianceErrors = {
  SENSITIVE_DATA_ACCESS_DENIED: 'Access to sensitive data denied due to compliance requirements',
  MFA_REQUIRED: 'Multi-factor authentication required for sensitive data access',
  CONSENT_REQUIRED: 'Client consent required for this operation',
  AUDIT_FAILURE: 'Failed to create required audit trail',
  ENCRYPTION_REQUIRED: 'Data encryption required for sensitive data storage',
  RETENTION_VIOLATION: 'Data retention policy violation',
  UNAUTHORIZED_EXPORT: 'Unauthorized attempt to export sensitive data'
};

// Compliance check functions
export const ComplianceChecks = {
  /**
   * Validate if user can access specific sensitive data
   */
  validateSensitiveDataAccess: async (
    userId: string,
    dataType: string,
    operation: string,
    userRoles: string[],
    mfaVerified: boolean
  ): Promise<{ allowed: boolean; reason?: string }> => {
    // Check if sensitive data
    if (!ComplianceUtils.isSensitiveData(dataType)) {
      return { allowed: true };
    }

    // Check MFA requirement
    if (ComplianceUtils.requiresMFA(dataType, operation) && !mfaVerified) {
      return { allowed: false, reason: ComplianceErrors.MFA_REQUIRED };
    }

    // Check role-based access
    const hasValidRole = userRoles.some(role =>
      ['coach', 'admin', 'super_admin'].includes(role)
    );

    if (!hasValidRole) {
      return { allowed: false, reason: ComplianceErrors.SENSITIVE_DATA_ACCESS_DENIED };
    }

    return { allowed: true };
  },

  /**
   * Check if operation requires audit logging
   */
  requiresAuditLogging: (dataType: string, operation: string): boolean => {
    return ComplianceUtils.isSensitiveData(dataType) ||
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
   * Generate compliance report summary
   */
  generateComplianceReport: (
    auditEvents: AuditEvent[]
  ) => ({
    executiveSummary: {
      totalEvents: auditEvents.length,
      criticalEvents: auditEvents.filter(e => e.severity === 'critical').length,
      period: {
        start: auditEvents.length > 0 ? auditEvents[0].timestamp : new Date(),
        end: new Date()
      }
    },
    administrativeControls: {
      status: 'compliant',
      lastReview: new Date()
    },
    physicalControls: {
      status: 'compliant',
      lastReview: new Date()
    },
    technicalControls: {
      status: 'compliant',
      lastReview: new Date()
    },
    auditSummary: {
      totalEvents: auditEvents.length,
      sensitiveDataAccess: auditEvents.filter(e => e.details?.sensitiveData).length,
      violations: auditEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
    }
  })
};