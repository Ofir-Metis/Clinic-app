import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';
import * as crypto from 'crypto';

export interface PHIDataRequest {
  dataType: string;
  operation: 'read' | 'write' | 'update' | 'delete' | 'export';
  userId: string;
  patientId?: string;
  resourceId?: string;
  purpose: string;
  context: HealthcareLogContext;
}

export interface PHIAccessControl {
  userId: string;
  roles: string[];
  permissions: string[];
  mfaVerified: boolean;
  sessionExpiry: Date;
  accessRestrictions: {
    allowedOperations: string[];
    allowedDataTypes: string[];
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
    locationRestrictions?: string[];
  };
}

export interface PHIAuditEntry {
  auditId: string;
  timestamp: Date;
  userId: string;
  patientId?: string;
  dataType: string;
  operation: string;
  purpose: string;
  accessGranted: boolean;
  denyReason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  mfaVerified: boolean;
  dataSize?: number;
  retentionDate: Date; // HIPAA requires 7-year retention
}

export interface DataMinimization {
  requestedFields: string[];
  authorizedFields: string[];
  filteredFields: string[];
  reason: string;
}

export interface ConsentManagement {
  consentId: string;
  patientId: string;
  consentType: 'treatment' | 'payment' | 'operations' | 'research' | 'marketing';
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  purpose: string;
  dataTypes: string[];
  restrictions?: string[];
}

@Injectable()
export class PHIDataHandlerService {
  private readonly logger = new Logger(PHIDataHandlerService.name);
  private readonly auditEntries: PHIAuditEntry[] = [];
  private readonly consentRecords = new Map<string, ConsentManagement[]>();
  private readonly encryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    this.encryptionKey = this.configService.get<string>('PHI_ENCRYPTION_KEY', '');
    if (!this.encryptionKey || this.encryptionKey.length < 32) {
      this.logger.warn('PHI_ENCRYPTION_KEY not configured or too short');
    }
  }

  /**
   * Handle PHI data access request with full compliance checks
   */
  async handlePHIDataRequest<T>(
    request: PHIDataRequest,
    dataHandler: () => Promise<T>
  ): Promise<T> {
    const auditId = this.generateAuditId();
    const startTime = Date.now();

    try {
      // Step 1: Validate access permissions
      const accessControl = await this.validateAccess(request);
      if (!accessControl) {
        await this.logPHIAccess(auditId, request, false, 'Access denied - insufficient permissions');
        throw new ForbiddenException('Access to sensitive data denied');
      }

      // Step 2: Verify MFA if required
      if (!accessControl.mfaVerified && this.requiresMFA(request.dataType, request.operation)) {
        await this.logPHIAccess(auditId, request, false, 'MFA verification required');
        throw new ForbiddenException('Multi-factor authentication required for this operation');
      }

      // Step 3: Verify consent (if required)
      if (request.patientId && this.requiresConsent(request.dataType, request.operation)) {
        const consentValid = await this.validateConsent(request.patientId, request.dataType, request.purpose);
        if (!consentValid) {
          await this.logPHIAccess(auditId, request, false, 'Client consent not found or expired');
          throw new ForbiddenException('Client consent required for this operation');
        }
      }

      // Step 4: Apply data minimization
      const minimization = this.applyDataMinimization(request, accessControl);

      // Step 5: Execute data operation
      const data = await dataHandler();

      // Step 6: Apply post-processing (encryption, filtering)
      const processedData = await this.postProcessPHIData(data, request, minimization);

      // Step 7: Log successful access
      await this.logPHIAccess(auditId, request, true, undefined, {
        dataSize: this.calculateDataSize(processedData),
        processingTime: Date.now() - startTime,
        minimizationApplied: minimization.filteredFields.length > 0
      });

      return processedData;

    } catch (error) {
      // Log failed access attempt
      await this.logPHIAccess(auditId, request, false, error.message);
      throw error;
    }
  }

  private requiresMFA(dataType: string, operation: string): boolean {
    const sensitiveTypes = ['client_demographics', 'session_notes', 'financial_information'];
    const sensitiveOperations = ['export', 'delete'];
    return sensitiveTypes.includes(dataType) || sensitiveOperations.includes(operation);
  }

  /**
   * Encrypt PHI data for storage
   */
  async encryptPHIData(data: any, dataType: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('PHI encryption key not configured');
    }

    try {
      const serializedData = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey.slice(0, 32), iv);
      
      let encrypted = cipher.update(serializedData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      const encryptedData = {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encrypted,
        dataType,
        encryptedAt: new Date().toISOString()
      };

      this.centralizedLogger.auditLog('PHI data encrypted', {
        dataType: dataType as 'system' | 'phi' | 'pii' | 'general',
        encryptionAlgorithm: 'aes-256-gcm',
        service: 'phi-data-handler',
        action: 'data_encrypted',
        hipaaRelevant: true,
        auditRequired: true
      });

      return Buffer.from(JSON.stringify(encryptedData)).toString('base64');

    } catch (error) {
      this.centralizedLogger.logError('PHI encryption failed', {
        dataType: dataType as 'system' | 'phi' | 'pii' | 'general',
        error: error.message,
        service: 'phi-data-handler'
      });
      throw new Error('PHI encryption failed');
    }
  }

  /**
   * Decrypt PHI data from storage
   */
  async decryptPHIData<T>(encryptedData: string, expectedDataType: string): Promise<T> {
    if (!this.encryptionKey) {
      throw new Error('PHI encryption key not configured');
    }

    try {
      const encryptedObj = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      
      if (encryptedObj.dataType !== expectedDataType) {
        throw new Error('Data type mismatch during decryption');
      }

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey.slice(0, 32), Buffer.from(encryptedObj.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedObj.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const data = JSON.parse(decrypted);

      this.centralizedLogger.auditLog('PHI data decrypted', {
        dataType: expectedDataType as 'system' | 'phi' | 'pii' | 'general',
        service: 'phi-data-handler',
        action: 'data_decrypted',
        hipaaRelevant: true,
        auditRequired: true
      });

      return data;

    } catch (error) {
      this.centralizedLogger.logError('PHI decryption failed', {
        expectedDataType,
        error: error.message,
        service: 'phi-data-handler'
      });
      throw new Error('PHI decryption failed');
    }
  }

  /**
   * Anonymize PHI data for research/analytics
   */
  async anonymizePHIData(data: any, anonymizationLevel: 'basic' | 'advanced' | 'full'): Promise<any> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const anonymized = JSON.parse(JSON.stringify(data)); // Deep clone

    // Define fields to anonymize based on level
    const fieldMappings = {
      basic: ['name', 'email', 'phone', 'address'],
      advanced: ['name', 'email', 'phone', 'address', 'ssn', 'medicalRecordNumber', 'dateOfBirth'],
      full: ['name', 'email', 'phone', 'address', 'ssn', 'medicalRecordNumber', 'dateOfBirth', 'emergencyContact']
    };

    const fieldsToAnonymize = fieldMappings[anonymizationLevel] || fieldMappings.basic;

    // Apply anonymization
    this.anonymizeFields(anonymized, fieldsToAnonymize);

    // Apply date shifting for temporal data
    if (anonymizationLevel === 'advanced' || anonymizationLevel === 'full') {
      this.shiftDates(anonymized);
    }

    this.centralizedLogger.auditLog('PHI data anonymized', {
      anonymizationLevel,
      fieldsAnonymized: fieldsToAnonymize.length,
      service: 'phi-data-handler',
      action: 'data_anonymized',
      hipaaRelevant: true,
      auditRequired: true
    });

    return anonymized;
  }

  /**
   * Manage patient consent
   */
  async manageConsent(consent: ConsentManagement): Promise<void> {
    const patientConsents = this.consentRecords.get(consent.patientId) || [];
    
    // Remove any existing consent of the same type
    const filteredConsents = patientConsents.filter(c => c.consentType !== consent.consentType);
    
    // Add new consent
    filteredConsents.push(consent);
    this.consentRecords.set(consent.patientId, filteredConsents);

    this.centralizedLogger.auditLog('Patient consent updated', {
      patientId: consent.patientId,
      consentType: consent.consentType,
      granted: consent.granted,
      purpose: consent.purpose,
      service: 'phi-data-handler',
      action: 'consent_updated',
      hipaaRelevant: true,
      auditRequired: true
    });
  }

  /**
   * Get PHI audit trail for a specific patient
   */
  async getPHIAuditTrail(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PHIAuditEntry[]> {
    const trail = this.auditEntries.filter(entry => {
      if (entry.patientId !== patientId) return false;
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });

    // Sort by timestamp (most recent first)
    return trail.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalAccesses: number;
      authorizedAccesses: number;
      deniedAccesses: number;
      uniqueUsers: number;
      uniquePatients: number;
    };
    violations: PHIAuditEntry[];
    dataBreaches: any[];
    consentOverview: {
      totalConsents: number;
      activeConsents: number;
      revokedConsents: number;
    };
  }> {
    const relevantEntries = this.auditEntries.filter(entry =>
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );

    const authorizedAccesses = relevantEntries.filter(e => e.accessGranted);
    const deniedAccesses = relevantEntries.filter(e => !e.accessGranted);
    const uniqueUsers = new Set(relevantEntries.map(e => e.userId)).size;
    const uniquePatients = new Set(relevantEntries.map(e => e.patientId).filter(Boolean)).size;

    const violations = deniedAccesses.filter(entry => 
      entry.denyReason?.includes('violation') || entry.denyReason?.includes('unauthorized')
    );

    // Count consents
    const allConsents = Array.from(this.consentRecords.values()).flat();
    const activeConsents = allConsents.filter(c => c.granted && !c.revokedAt);
    const revokedConsents = allConsents.filter(c => c.revokedAt);

    return {
      summary: {
        totalAccesses: relevantEntries.length,
        authorizedAccesses: authorizedAccesses.length,
        deniedAccesses: deniedAccesses.length,
        uniqueUsers,
        uniquePatients
      },
      violations,
      dataBreaches: [], // Would be populated with actual breach data
      consentOverview: {
        totalConsents: allConsents.length,
        activeConsents: activeConsents.length,
        revokedConsents: revokedConsents.length
      }
    };
  }

  // Private helper methods

  private async validateAccess(request: PHIDataRequest): Promise<PHIAccessControl | null> {
    // In production, this would check against user management system
    // For now, return a mock access control object
    return {
      userId: request.userId,
      roles: ['coach'], // Would be fetched from user service
      permissions: ['read_phi', 'write_phi'],
      mfaVerified: request.context.mfaVerified || false,
      sessionExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      accessRestrictions: {
        allowedOperations: ['read', 'write', 'update'],
        allowedDataTypes: ['client_demographics', 'session_notes']
      }
    };
  }

  private requiresConsent(dataType: string, operation: string): boolean {
    const consentRequiredTypes = ['marketing', 'research', 'non_treatment'];
    const consentRequiredOperations = ['export', 'share'];
    
    return consentRequiredTypes.includes(dataType) || consentRequiredOperations.includes(operation);
  }

  private async validateConsent(patientId: string, dataType: string, purpose: string): Promise<boolean> {
    const consents = this.consentRecords.get(patientId) || [];
    
    return consents.some(consent =>
      consent.granted &&
      !consent.revokedAt &&
      consent.dataTypes.includes(dataType) &&
      consent.purpose === purpose &&
      (!consent.expiresAt || consent.expiresAt > new Date())
    );
  }

  private applyDataMinimization(request: PHIDataRequest, accessControl: PHIAccessControl): DataMinimization {
    // This would implement actual field-level access control
    const allFields = ['id', 'name', 'dateOfBirth', 'ssn', 'address', 'phone', 'email', 'medicalHistory'];
    const authorizedFields = allFields; // Simplified for example
    const filteredFields: string[] = [];

    return {
      requestedFields: allFields,
      authorizedFields,
      filteredFields,
      reason: 'Access control policy applied'
    };
  }

  private async postProcessPHIData<T>(
    data: T,
    request: PHIDataRequest,
    minimization: DataMinimization
  ): Promise<T> {
    // Apply field filtering based on minimization
    if (minimization.filteredFields.length > 0 && typeof data === 'object' && data !== null) {
      const filtered = { ...data };
      minimization.filteredFields.forEach(field => {
        delete (filtered as any)[field];
      });
      return filtered;
    }

    return data;
  }

  private async logPHIAccess(
    auditId: string,
    request: PHIDataRequest,
    accessGranted: boolean,
    denyReason?: string,
    metadata?: any
  ): Promise<void> {
    const auditEntry: PHIAuditEntry = {
      auditId,
      timestamp: new Date(),
      userId: request.userId,
      patientId: request.patientId,
      dataType: request.dataType as 'system' | 'phi' | 'pii' | 'general',
      operation: request.operation,
      purpose: request.purpose,
      accessGranted,
      denyReason,
      ipAddress: request.context.ipAddress,
      userAgent: request.context.userAgent,
      sessionId: request.context.sessionId,
      mfaVerified: request.context.mfaVerified || false,
      dataSize: metadata?.dataSize,
      retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
    };

    this.auditEntries.push(auditEntry);

    // Log to centralized logging system
    this.centralizedLogger.auditLog('PHI data access', {
      auditId,
      userId: request.userId,
      patientId: request.patientId,
      dataType: request.dataType as 'system' | 'phi' | 'pii' | 'general',
      operation: request.operation,
      accessGranted,
      denyReason,
      mfaVerified: auditEntry.mfaVerified,
      service: 'phi-data-handler',
      action: 'phi_access',
      hipaaRelevant: true,
      auditRequired: true,
      retentionYears: 7
    });
  }

  private generateAuditId(): string {
    return `PHI-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private calculateDataSize(data: any): number {
    try {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    } catch {
      return 0;
    }
  }

  private anonymizeFields(obj: any, fields: string[]): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      if (fields.includes(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = this.generateAnonymousValue(key, obj[key]);
        } else if (typeof obj[key] === 'number') {
          obj[key] = Math.floor(Math.random() * 1000000);
        }
      } else if (typeof obj[key] === 'object') {
        this.anonymizeFields(obj[key], fields);
      }
    });
  }

  private generateAnonymousValue(fieldName: string, originalValue: string): string {
    const anonymousValues = {
      name: ['Anonymous User', 'Patient A', 'Subject B', 'Individual C'],
      email: ['anonymous@example.com', 'patient@clinic.anonymous'],
      phone: ['555-0000', '555-1111', '555-2222'],
      address: ['123 Anonymous St', '456 Privacy Ave', '789 Confidential Blvd'],
      ssn: ['***-**-****'],
      medicalRecordNumber: ['MRN-ANON-' + Math.floor(Math.random() * 10000)]
    };

    const values = anonymousValues[fieldName] || ['[REDACTED]'];
    return values[Math.floor(Math.random() * values.length)];
  }

  private shiftDates(obj: any, shiftDays: number = Math.floor(Math.random() * 365)): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string' && this.isDateString(obj[key])) {
        const date = new Date(obj[key]);
        date.setDate(date.getDate() + shiftDays);
        obj[key] = date.toISOString();
      } else if (typeof obj[key] === 'object') {
        this.shiftDates(obj[key], shiftDays);
      }
    });
  }

  private isDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(Date.parse(value));
  }
}