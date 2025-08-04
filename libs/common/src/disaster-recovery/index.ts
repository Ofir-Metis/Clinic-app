/**
 * Disaster Recovery and Business Continuity Module
 * 
 * Comprehensive disaster recovery solution for healthcare applications with:
 * - Automated backup and restore capabilities
 * - Business continuity planning and management
 * - Failover and recovery procedures
 * - HIPAA-compliant data retention and recovery
 * - Crisis management and communication
 */

// Core services
export * from './disaster-recovery.service';
export * from './business-continuity.service';

// Module exports
export * from './disaster-recovery.module';

// Type definitions
export type {
  DisasterRecoveryConfig,
  BackupMetadata,
  RecoveryPoint,
  FailoverStatus,
  DisasterRecoveryPlan,
  DisasterScenario,
  RecoveryProcedure,
  RecoveryStep,
  EmergencyContact,
  RecoveryResource,
  TestResult
} from './disaster-recovery.service';

export type {
  BusinessImpactAnalysis,
  ContinuityStrategy,
  CrisisManagementTeam,
  ContinuityPlan,
  CommunicationPlan,
  TrainingProgram,
  TestingSchedule,
  MaintenanceSchedule,
  IncidentStatus
} from './business-continuity.service';

export type {
  DisasterRecoveryModuleOptions
} from './disaster-recovery.module';

// Constants and enums
export const DisasterRecoveryConstants = {
  // Recovery objectives (in minutes)
  RPO: {
    CRITICAL: 15,
    HIGH: 60,
    MEDIUM: 240,
    LOW: 1440
  },
  
  RTO: {
    CRITICAL: 60,
    HIGH: 240,
    MEDIUM: 480,
    LOW: 1440
  },
  
  // Backup types
  BACKUP_TYPES: {
    FULL: 'full',
    INCREMENTAL: 'incremental',
    DIFFERENTIAL: 'differential'
  } as const,
  
  // Criticality levels
  CRITICALITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  } as const,
  
  // Test types
  TEST_TYPES: {
    TABLETOP: 'tabletop',
    WALKTHROUGH: 'walkthrough',
    SIMULATION: 'simulation',
    FULL_SCALE: 'full-scale'
  } as const,
  
  // Incident statuses
  INCIDENT_STATUS: {
    ACTIVE: 'active',
    CONTAINED: 'contained',
    RESOLVED: 'resolved',
    POST_INCIDENT: 'post-incident'
  } as const,
  
  // Failover modes
  FAILOVER_MODES: {
    AUTOMATIC: 'automatic',
    MANUAL: 'manual'
  } as const,
  
  // Replication modes
  REPLICATION_MODES: {
    SYNC: 'sync',
    ASYNC: 'async',
    SEMI_SYNC: 'semi-sync'
  } as const
};

// Default configurations
export const DefaultDisasterRecoveryConfig = {
  // Standard configuration
  standard: {
    rpo: DisasterRecoveryConstants.RPO.MEDIUM,
    rto: DisasterRecoveryConstants.RTO.MEDIUM,
    backupRetentionDays: 365,
    replicationMode: DisasterRecoveryConstants.REPLICATION_MODES.ASYNC,
    failoverMode: DisasterRecoveryConstants.FAILOVER_MODES.MANUAL,
    healthCheckInterval: 300000, // 5 minutes
    backupSchedule: '0 2 * * *', // 2 AM daily
    enableCrossRegionReplication: true,
    encryptBackups: true
  },
  
  // Healthcare configuration (HIPAA compliant)
  healthcare: {
    rpo: DisasterRecoveryConstants.RPO.CRITICAL,
    rto: DisasterRecoveryConstants.RTO.CRITICAL,
    backupRetentionDays: 2555, // 7 years
    replicationMode: DisasterRecoveryConstants.REPLICATION_MODES.ASYNC,
    failoverMode: DisasterRecoveryConstants.FAILOVER_MODES.MANUAL,
    healthCheckInterval: 60000, // 1 minute
    backupSchedule: '0 2 * * *', // 2 AM daily
    enableCrossRegionReplication: true,
    encryptBackups: true,
    enableBusinessContinuity: true,
    enableAutomatedTesting: true
  },
  
  // High availability configuration
  highAvailability: {
    rpo: DisasterRecoveryConstants.RPO.CRITICAL,
    rto: DisasterRecoveryConstants.RTO.CRITICAL,
    backupRetentionDays: 365,
    replicationMode: DisasterRecoveryConstants.REPLICATION_MODES.SYNC,
    failoverMode: DisasterRecoveryConstants.FAILOVER_MODES.AUTOMATIC,
    healthCheckInterval: 30000, // 30 seconds
    backupSchedule: '0 */6 * * *', // Every 6 hours
    enableCrossRegionReplication: true,
    encryptBackups: true,
    enableBusinessContinuity: true,
    enableAutomatedTesting: true
  }
} as const;

// Utility functions
export const DisasterRecoveryUtils = {
  /**
   * Calculate business impact score
   */
  calculateBusinessImpactScore: (
    financialImpact: number,
    operationalImpact: number,
    reputationalImpact: number,
    complianceImpact: number
  ): number => {
    const weights = { financial: 0.4, operational: 0.3, reputational: 0.2, compliance: 0.1 };
    return Math.round(
      financialImpact * weights.financial +
      operationalImpact * weights.operational +
      reputationalImpact * weights.reputational +
      complianceImpact * weights.compliance
    );
  },
  
  /**
   * Determine criticality based on impact score
   */
  determineCriticality: (impactScore: number): string => {
    if (impactScore >= 90) return DisasterRecoveryConstants.CRITICALITY.CRITICAL;
    if (impactScore >= 70) return DisasterRecoveryConstants.CRITICALITY.HIGH;
    if (impactScore >= 40) return DisasterRecoveryConstants.CRITICALITY.MEDIUM;
    return DisasterRecoveryConstants.CRITICALITY.LOW;
  },
  
  /**
   * Calculate estimated recovery cost
   */
  calculateRecoveryCost: (
    downtime: number, // in hours
    hourlyLoss: number,
    recoveryResources: number
  ): number => {
    return downtime * hourlyLoss + recoveryResources;
  },
  
  /**
   * Validate backup integrity
   */
  validateBackupIntegrity: (
    expectedChecksum: string,
    actualChecksum: string,
    expectedSize: number,
    actualSize: number
  ): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (expectedChecksum !== actualChecksum) {
      issues.push('Checksum mismatch detected');
    }
    
    if (Math.abs(expectedSize - actualSize) > expectedSize * 0.05) { // 5% tolerance
      issues.push('Size variance exceeds acceptable threshold');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  },
  
  /**
   * Calculate RTO compliance
   */
  calculateRTOCompliance: (
    targetRTO: number,
    actualRecoveryTime: number
  ): { compliant: boolean; variance: number } => {
    const variance = ((actualRecoveryTime - targetRTO) / targetRTO) * 100;
    return {
      compliant: actualRecoveryTime <= targetRTO,
      variance: Math.round(variance)
    };
  },
  
  /**
   * Calculate RPO compliance
   */
  calculateRPOCompliance: (
    targetRPO: number,
    actualDataLoss: number
  ): { compliant: boolean; variance: number } => {
    const variance = ((actualDataLoss - targetRPO) / targetRPO) * 100;
    return {
      compliant: actualDataLoss <= targetRPO,
      variance: Math.round(variance)
    };
  },
  
  /**
   * Generate backup retention schedule
   */
  generateRetentionSchedule: (
    retentionDays: number,
    backupFrequency: 'daily' | 'weekly' | 'monthly'
  ): Array<{ type: string; retention: number }> => {
    const schedule = [];
    
    // Daily backups for short-term retention
    if (backupFrequency === 'daily') {
      schedule.push({ type: 'daily', retention: Math.min(30, retentionDays) });
    }
    
    // Weekly backups for medium-term retention
    if (retentionDays > 30) {
      schedule.push({ type: 'weekly', retention: Math.min(12, Math.floor(retentionDays / 7)) });
    }
    
    // Monthly backups for long-term retention
    if (retentionDays > 90) {
      schedule.push({ type: 'monthly', retention: Math.floor(retentionDays / 30) });
    }
    
    return schedule;
  }
};

// Error classes
export class DisasterRecoveryError extends Error {
  constructor(message: string, public readonly code: string = 'DR_ERROR') {
    super(message);
    this.name = 'DisasterRecoveryError';
  }
}

export class BackupError extends Error {
  constructor(message: string, public readonly code: string = 'BACKUP_ERROR') {
    super(message);
    this.name = 'BackupError';
  }
}

export class RestoreError extends Error {
  constructor(message: string, public readonly code: string = 'RESTORE_ERROR') {
    super(message);
    this.name = 'RestoreError';
  }
}

export class FailoverError extends Error {
  constructor(message: string, public readonly code: string = 'FAILOVER_ERROR') {
    super(message);
    this.name = 'FailoverError';
  }
}

export class BusinessContinuityError extends Error {
  constructor(message: string, public readonly code: string = 'BCP_ERROR') {
    super(message);
    this.name = 'BusinessContinuityError';
  }
}

// Validation helpers
export const DisasterRecoveryValidation = {
  /**
   * Validate RPO/RTO objectives
   */
  validateRecoveryObjectives: (rpo: number, rto: number): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (rpo <= 0) issues.push('RPO must be greater than 0');
    if (rto <= 0) issues.push('RTO must be greater than 0');
    if (rpo > rto) issues.push('RPO cannot be greater than RTO');
    
    return { valid: issues.length === 0, issues };
  },
  
  /**
   * Validate backup configuration
   */
  validateBackupConfig: (config: any): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!config.backupSchedule) issues.push('Backup schedule is required');
    if (config.backupRetentionDays < 1) issues.push('Backup retention must be at least 1 day');
    if (!['sync', 'async', 'semi-sync'].includes(config.replicationMode)) {
      issues.push('Invalid replication mode');
    }
    
    return { valid: issues.length === 0, issues };
  },
  
  /**
   * Validate business impact analysis
   */
  validateBusinessImpactAnalysis: (bia: any): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!bia.processName) issues.push('Process name is required');
    if (!bia.processOwner) issues.push('Process owner is required');
    if (!['low', 'medium', 'high', 'critical'].includes(bia.criticality)) {
      issues.push('Invalid criticality level');
    }
    if (bia.rto <= 0) issues.push('RTO must be greater than 0');
    if (bia.rpo <= 0) issues.push('RPO must be greater than 0');
    
    return { valid: issues.length === 0, issues };
  }
};

// Helper functions
export const DisasterRecoveryHelpers = {
  /**
   * Format recovery time for display
   */
  formatRecoveryTime: (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    return `${Math.round(minutes / 1440)} days`;
  },
  
  /**
   * Calculate downtime impact
   */
  calculateDowntimeImpact: (
    startTime: Date,
    endTime: Date,
    hourlyLoss: number
  ): { duration: number; cost: number } => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return {
      duration: Math.round(durationHours * 100) / 100,
      cost: Math.round(durationHours * hourlyLoss)
    };
  },
  
  /**
   * Generate incident report
   */
  generateIncidentReport: (incident: any): string => {
    return `
Incident Report: ${incident.incidentId}
Type: ${incident.incidentType}
Severity: ${incident.severity}
Start Time: ${incident.startTime.toISOString()}
Duration: ${DisasterRecoveryHelpers.formatRecoveryTime(incident.duration || 0)}
Affected Processes: ${incident.affectedProcesses.join(', ')}
Status: ${incident.status}
    `.trim();
  },
  
  /**
   * Create backup filename
   */
  createBackupFilename: (
    type: string,
    timestamp: Date,
    service?: string
  ): string => {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
    const serviceStr = service ? `-${service}` : '';
    return `backup-${type}${serviceStr}-${dateStr}-${timeStr}`;
  }
};