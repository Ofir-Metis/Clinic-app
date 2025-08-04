/**
 * MFA Integration Examples
 * 
 * This file demonstrates how to integrate the MFA system
 * across different parts of the clinic management platform.
 */

import { Injectable, Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { 
  MFAGuard, 
  RoleBasedMFAGuard,
  RequireMFA, 
  SkipMFA,
  MFAService,
  MFAStorageService,
  MFASessionManager
} from '@clinic/common';
import { JwtAuthGuard } from '../services/auth-service/src/auth/jwt-auth.guard';

// ============================================================================
// CONTROLLER EXAMPLES WITH MFA PROTECTION
// ============================================================================

/**
 * Patient Controller - Healthcare data requires MFA
 */
@Controller('api/patients')
@UseGuards(JwtAuthGuard, MFAGuard)
export class PatientController {
  
  @Get()
  @RequireMFA() // List patients requires MFA
  async getPatients(@Request() req: any) {
    return {
      patients: [
        { id: '1', name: 'John Doe', lastVisit: '2024-01-15' },
        { id: '2', name: 'Jane Smith', lastVisit: '2024-01-14' }
      ],
      mfaVerified: true
    };
  }

  @Get(':id')
  @RequireMFA() // Individual patient data requires MFA
  async getPatient(@Param('id') id: string, @Request() req: any) {
    return {
      id,
      name: 'John Doe',
      dateOfBirth: '1985-06-15',
      medicalRecord: 'MRN-12345',
      // PHI data protected by MFA
      diagnoses: ['Diabetes Type 2', 'Hypertension'],
      medications: ['Metformin', 'Lisinopril'],
      mfaVerified: true
    };
  }

  @Post()
  @RequireMFA() // Creating patients requires MFA
  async createPatient(@Body() patientData: any, @Request() req: any) {
    return {
      id: Date.now().toString(),
      ...patientData,
      createdAt: new Date(),
      createdBy: req.user.id,
      mfaVerified: true
    };
  }

  @Get('public/statistics')
  @SkipMFA() // Public statistics don't require MFA
  async getPublicStatistics() {
    return {
      totalPatients: 1250,
      activePatients: 892,
      newPatientsThisMonth: 47
    };
  }
}

/**
 * Admin Controller - Always requires MFA
 */
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RoleBasedMFAGuard) // Role-based MFA enforcement
export class AdminController {
  
  @Get('users')
  // MFA automatically required for admin users
  async getUsers(@Request() req: any) {
    return {
      users: [
        { id: '1', email: 'admin@clinic.com', role: 'admin', mfaEnabled: true },
        { id: '2', email: 'nurse@clinic.com', role: 'nurse', mfaEnabled: false }
      ],
      adminAccess: true,
      mfaVerified: true
    };
  }

  @Post('users/:id/disable-mfa')
  @RequireMFA() // Explicit MFA requirement for sensitive operations
  async disableUserMFA(@Param('id') userId: string, @Request() req: any) {
    // Only allow admins to disable MFA for other users
    if (!req.user.roles.includes('admin')) {
      throw new UnauthorizedException('Admin privileges required');
    }

    return {
      success: true,
      message: `MFA disabled for user ${userId}`,
      disabledBy: req.user.id,
      timestamp: new Date()
    };
  }

  @Get('audit-logs')
  @RequireMFA() // Audit logs always require MFA
  async getAuditLogs(@Request() req: any) {
    return {
      logs: [
        {
          timestamp: '2024-01-15T10:30:00Z',
          user: 'admin@clinic.com',
          action: 'patient_data_accessed',
          resource: 'patient:123',
          mfaVerified: true
        }
      ],
      totalCount: 1542,
      mfaVerified: true
    };
  }
}

/**
 * Medical Records Controller - High security requirements
 */
@Controller('api/medical-records')
@UseGuards(JwtAuthGuard, RoleBasedMFAGuard)
export class MedicalRecordsController {
  
  @Get(':patientId')
  @RequireMFA() // Medical records always require MFA
  async getMedicalRecords(@Param('patientId') patientId: string, @Request() req: any) {
    return {
      patientId,
      records: [
        {
          date: '2024-01-15',
          diagnosis: 'Annual Checkup',
          notes: 'Patient in good health',
          provider: 'Dr. Smith'
        }
      ],
      accessedBy: req.user.id,
      mfaVerified: true,
      hipaaCompliant: true
    };
  }

  @Post(':patientId')
  @RequireMFA() // Creating medical records requires MFA
  async createMedicalRecord(
    @Param('patientId') patientId: string,
    @Body() recordData: any,
    @Request() req: any
  ) {
    return {
      id: Date.now().toString(),
      patientId,
      ...recordData,
      createdBy: req.user.id,
      createdAt: new Date(),
      mfaVerified: true,
      hipaaCompliant: true
    };
  }
}

// ============================================================================
// SERVICE EXAMPLES WITH MFA INTEGRATION
// ============================================================================

/**
 * Enhanced Auth Service with MFA Integration
 */
@Injectable()
export class EnhancedAuthService {
  constructor(
    private readonly mfaService: MFAService,
    private readonly mfaStorageService: MFAStorageService
  ) {}

  /**
   * Login with MFA check
   */
  async login(email: string, password: string) {
    // Standard authentication
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.generateJWT(user);

    // Check MFA status
    const mfaSettings = await this.mfaStorageService.getUserMFASettings(user.id);
    
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles
      },
      mfa: {
        enabled: mfaSettings?.isMFAEnabled || false,
        required: mfaSettings?.isMFARequired || false,
        setupRequired: !mfaSettings?.isMFAEnabled && mfaSettings?.isMFARequired,
        verificationRequired: mfaSettings?.isMFAEnabled
      }
    };
  }

  /**
   * Complete login with MFA verification
   */
  async completeMFALogin(userId: string, token: string) {
    const mfaEntity = await this.mfaStorageService.getMFASecret(userId);
    if (!mfaEntity) {
      throw new BadRequestException('MFA not enabled for user');
    }

    const verificationResult = await this.mfaService.verifyMFAToken(
      mfaEntity.secret,
      token,
      mfaEntity.backupCodes,
      userId
    );

    if (!verificationResult.isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    // Update backup codes if one was used
    if (verificationResult.usedBackupCode) {
      await this.mfaStorageService.updateBackupCodes(
        userId,
        mfaEntity.backupCodes.filter(code => code !== verificationResult.usedBackupCode)
      );
    }

    // Record MFA usage
    await this.mfaStorageService.recordMFAUsage(
      userId,
      verificationResult.usedBackupCode ? 'backup_code' : 'totp'
    );

    return {
      success: true,
      mfaVerified: true,
      sessionDuration: '30 minutes',
      remainingBackupCodes: verificationResult.remainingBackupCodes
    };
  }

  /**
   * Check if user needs MFA re-verification
   */
  async checkMFAStatus(request: any, userId: string) {
    const userSettings = await this.mfaStorageService.getUserMFASettings(userId);
    
    if (!userSettings?.isMFAEnabled) {
      return { required: false, verified: true };
    }

    const needsReVerification = MFASessionManager.needsMFAReVerification(request, 30);
    
    return {
      required: true,
      verified: !needsReVerification,
      needsReVerification,
      lastVerification: userSettings.lastMFAUsed
    };
  }

  private validateUser(email: string, password: string) {
    // Implementation for user validation
    return null;
  }

  private generateJWT(user: any) {
    // Implementation for JWT generation
    return 'jwt-token';
  }
}

/**
 * Healthcare Data Service with MFA Requirements
 */
@Injectable()
export class HealthcareDataService {
  constructor(private readonly mfaStorageService: MFAStorageService) {}

  /**
   * Access sensitive healthcare data with MFA verification
   */
  async accessPHIData(userId: string, patientId: string, request: any) {
    // Verify MFA for PHI access
    const mfaStatus = await this.checkMFAForPHI(userId, request);
    if (!mfaStatus.verified) {
      throw new UnauthorizedException('MFA verification required for PHI access');
    }

    // Log PHI access for HIPAA compliance
    await this.logPHIAccess(userId, patientId, 'data_accessed');

    return {
      patientId,
      data: {
        // Protected Health Information
        ssn: '***-**-1234',
        medicalHistory: ['Diabetes', 'Hypertension'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg']
      },
      mfaVerified: true,
      hipaaCompliant: true,
      accessedAt: new Date()
    };
  }

  /**
   * Bulk data export requires enhanced MFA verification
   */
  async exportPatientData(userId: string, patientIds: string[], request: any) {
    // Enhanced MFA check for bulk operations
    const mfaVerification = request.session?.mfaVerification;
    if (!mfaVerification || this.isRecentVerification(mfaVerification.timestamp, 10)) {
      throw new UnauthorizedException('Recent MFA verification required for bulk export');
    }

    // Log bulk export for audit
    await this.logBulkOperation(userId, 'bulk_export', patientIds.length);

    return {
      exportId: Date.now().toString(),
      patientCount: patientIds.length,
      status: 'processing',
      mfaVerified: true,
      requestedBy: userId,
      requestedAt: new Date()
    };
  }

  private async checkMFAForPHI(userId: string, request: any) {
    const settings = await this.mfaStorageService.getUserMFASettings(userId);
    if (!settings?.isMFAEnabled) {
      return { verified: false, reason: 'MFA not enabled' };
    }

    const needsReVerification = MFASessionManager.needsMFAReVerification(request, 15); // 15 min for PHI
    return {
      verified: !needsReVerification,
      reason: needsReVerification ? 'MFA verification expired' : 'verified'
    };
  }

  private async logPHIAccess(userId: string, patientId: string, action: string) {
    // HIPAA audit logging implementation
    console.log(`PHI Access: ${userId} -> ${patientId} (${action})`);
  }

  private async logBulkOperation(userId: string, operation: string, recordCount: number) {
    // Bulk operation audit logging
    console.log(`Bulk Operation: ${userId} -> ${operation} (${recordCount} records)`);
  }

  private isRecentVerification(timestamp: string, minutes: number): boolean {
    const verificationTime = new Date(timestamp);
    const now = new Date();
    return (now.getTime() - verificationTime.getTime()) > (minutes * 60 * 1000);
  }
}

// ============================================================================
// CUSTOM MFA MIDDLEWARE EXAMPLES
// ============================================================================

/**
 * Custom MFA middleware for specific routes
 */
@Injectable()
export class HealthcareMFAMiddleware {
  constructor(private readonly mfaStorageService: MFAStorageService) {}

  async use(req: any, res: any, next: Function) {
    // Skip for non-healthcare routes
    if (!this.isHealthcareRoute(req.path)) {
      return next();
    }

    // Skip if user not authenticated
    if (!req.user) {
      return next();
    }

    // Check if user has healthcare role
    const hasHealthcareRole = req.user.roles?.some(role => 
      ['doctor', 'nurse', 'therapist', 'healthcare_provider'].includes(role)
    );

    if (hasHealthcareRole) {
      // Enforce MFA for healthcare providers
      const mfaSettings = await this.mfaStorageService.getUserMFASettings(req.user.id);
      
      if (!mfaSettings?.isMFAEnabled) {
        return res.status(403).json({
          error: 'MFA_REQUIRED',
          message: 'Healthcare providers must enable MFA',
          setupRequired: true
        });
      }

      // Check recent verification for sensitive operations
      if (this.isSensitiveOperation(req)) {
        const needsReVerification = MFASessionManager.needsMFAReVerification(req, 10); // 10 min for sensitive ops
        
        if (needsReVerification) {
          return res.status(401).json({
            error: 'MFA_REVERIFICATION_REQUIRED',
            message: 'Recent MFA verification required for this operation',
            maxAge: '10 minutes'
          });
        }
      }
    }

    next();
  }

  private isHealthcareRoute(path: string): boolean {
    const healthcarePaths = [
      '/api/patients',
      '/api/medical-records',
      '/api/prescriptions',
      '/api/diagnoses',
      '/api/treatments'
    ];
    
    return healthcarePaths.some(healthcarePath => 
      path.startsWith(healthcarePath)
    );
  }

  private isSensitiveOperation(req: any): boolean {
    // POST, PUT, DELETE operations on healthcare data
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return true;
    }

    // Bulk data access
    if (req.query.export || req.query.bulk) {
      return true;
    }

    // Admin operations
    if (req.path.includes('/admin/')) {
      return true;
    }

    return false;
  }
}

// ============================================================================
// FRONTEND INTEGRATION HELPERS
// ============================================================================

/**
 * MFA API Helper for Frontend Integration
 */
export class MFAApiHelper {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(): Promise<{
    qrCodeDataUrl: string;
    manualEntryKey: string;
    backupCodes: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/mfa/setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to setup MFA');
    }

    return response.json();
  }

  /**
   * Verify MFA setup
   */
  async verifySetup(token: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/mfa/setup/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ verificationToken: token })
    });

    return response.json();
  }

  /**
   * Verify MFA token for login
   */
  async verifyMFA(token: string): Promise<{
    success: boolean;
    mfaToken: string;
    sessionDuration: string;
  }> {
    const response = await fetch(`${this.baseUrl}/mfa/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    return response.json();
  }

  /**
   * Get MFA status
   */
  async getMFAStatus(): Promise<{
    mfaEnabled: boolean;
    mfaRequired: boolean;
    setupRequired: boolean;
    backupCodesRemaining: number;
  }> {
    const response = await fetch(`${this.baseUrl}/mfa/status`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return response.json();
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(currentToken: string): Promise<{
    backupCodes: string[];
    warning: string;
  }> {
    const response = await fetch(`${this.baseUrl}/mfa/backup-codes/regenerate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentToken })
    });

    return response.json();
  }

  /**
   * Disable MFA
   */
  async disableMFA(token: string): Promise<{ success: boolean; warning: string }> {
    const response = await fetch(`${this.baseUrl}/mfa/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    return response.json();
  }

  /**
   * Use emergency recovery code
   */
  async useRecoveryCode(recoveryCode: string): Promise<{
    success: boolean;
    mfaToken: string;
    temporaryAccess: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/mfa/recovery/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recoveryCode })
    });

    return response.json();
  }
}

// ============================================================================
// TESTING HELPERS
// ============================================================================

/**
 * MFA Testing Utilities
 */
export class MFATestHelper {
  
  /**
   * Generate test TOTP token for testing
   */
  static generateTestToken(secret: string): string {
    const speakeasy = require('speakeasy');
    return speakeasy.totp({
      secret,
      encoding: 'base32'
    });
  }

  /**
   * Mock MFA verification for testing
   */
  static mockMFAVerification(request: any, userId: string) {
    if (!request.session) {
      request.session = {};
    }
    
    (request.session as any).mfaVerification = {
      userId,
      verified: true,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    };
  }

  /**
   * Clear MFA verification for testing
   */
  static clearMFAVerification(request: any) {
    if (request.session && (request.session as any).mfaVerification) {
      delete (request.session as any).mfaVerification;
    }
  }

  /**
   * Create test MFA settings
   */
  static createTestMFASettings(userId: string, overrides: any = {}) {
    return {
      userId,
      isMFAEnabled: true,
      isMFARequired: true,
      hasVerifiedMFA: true,
      backupCodesRemaining: 8,
      lastMFAUsed: new Date(),
      mfaEnforcedByPolicy: true,
      ...overrides
    };
  }
}

export {
  PatientController,
  AdminController,
  MedicalRecordsController,
  EnhancedAuthService,
  HealthcareDataService,
  HealthcareMFAMiddleware,
  MFAApiHelper,
  MFATestHelper
};