import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditTrailService } from '../audit-trail.service';
import { AuditEventType, AuditSeverity } from '../enums/audit.enums';

/**
 * Guard to control access to audit trail functionality
 * Ensures only authorized users can access sensitive audit data
 */
@Injectable()
export class AuditAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has audit access permissions
    const hasAuditAccess = this.checkAuditPermissions(user);
    
    if (!hasAuditAccess) {
      // Log unauthorized audit access attempt
      await this.auditTrailService.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        request,
        AuditSeverity.HIGH,
        {
          attemptedResource: 'audit_trail',
          userRole: (user as any).role,
          deniedReason: 'insufficient_permissions',
        },
      );

      throw new ForbiddenException('Insufficient permissions to access audit trail');
    }

    // For patient-specific audit access, check additional permissions
    const patientId = this.extractPatientId(request);
    if (patientId && !this.checkPatientAuditAccess(user, patientId)) {
      await this.auditTrailService.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        request,
        AuditSeverity.HIGH,
        {
          attemptedResource: 'patient_audit_log',
          patientId,
          userRole: (user as any).role,
          deniedReason: 'no_patient_access',
        },
      );

      throw new ForbiddenException('No permission to access this patient\'s audit log');
    }

    // Log successful audit access
    await this.auditTrailService.logAdministrativeAction(
      (user as any).id,
      AuditEventType.AUDIT_LOG_ACCESSED,
      request,
      undefined,
      {
        accessedResource: request.path,
        patientId,
      },
    );

    return true;
  }

  private checkAuditPermissions(user: any): boolean {
    const allowedRoles = [
      'ADMIN',
      'SUPER_ADMIN', 
      'COMPLIANCE_OFFICER',
      'SECURITY_OFFICER',
      'THERAPIST', // Limited access for patient-specific audits
    ];

    return allowedRoles.includes(user.role);
  }

  private checkPatientAuditAccess(user: any, patientId: string): boolean {
    // Admins and compliance officers can access any patient's audit log
    if (['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER'].includes(user.role)) {
      return true;
    }

    // Therapists can only access audit logs for their assigned patients
    if (user.role === 'THERAPIST') {
      // This would typically check a database to see if the therapist is assigned to this patient
      // For now, we'll allow if the user has patient assignments
      return user.assignedPatients?.includes(patientId) || false;
    }

    return false;
  }

  private extractPatientId(request: Request): string | undefined {
    return (
      request.params.patientId ||
      request.query.patientId ||
      request.headers['x-patient-id']
    ) as string;
  }
}