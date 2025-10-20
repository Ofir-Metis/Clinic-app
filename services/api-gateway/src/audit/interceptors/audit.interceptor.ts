import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditTrailService } from '../audit-trail.service';
import { AuditEventType, AuditCategory, AuditSeverity, DeviceType } from '../enums/audit.enums';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditTrailService: AuditTrailService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Skip audit for certain endpoints to prevent log spam
    if (this.shouldSkipAudit(request)) {
      return next.handle();
    }

    const auditContext = this.buildAuditContext(request);

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Create audit event for successful requests
        this.createAuditEvent(
          request,
          response,
          auditContext,
          responseTime,
          data,
        ).catch((error) => {
          this.logger.error('Failed to create audit event', error.stack);
        });
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Create audit event for failed requests
        this.createErrorAuditEvent(
          request,
          response,
          auditContext,
          responseTime,
          error,
        ).catch((auditError) => {
          this.logger.error('Failed to create error audit event', auditError.stack);
        });

        throw error;
      }),
    );
  }

  private shouldSkipAudit(request: Request): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/audit/events', // Prevent recursive auditing
    ];

    const skipMethods = ['OPTIONS'];

    return (
      skipPaths.some(path => request.path.includes(path)) ||
      skipMethods.includes(request.method) ||
      request.path.includes('/static/') ||
      request.path.includes('/assets/')
    );
  }

  private buildAuditContext(request: Request) {
    return {
      userId: (request.user as any)?.id,
      userRole: (request.user as any)?.role,
      patientId: this.extractPatientId(request),
      sessionId: request.sessionID,
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.get('User-Agent'),
      deviceType: this.detectDeviceType(request.get('User-Agent')),
      clientApplication: this.detectClientApplication(request.get('User-Agent')),
      correlationId: request.headers['x-correlation-id'] as string,
    };
  }

  private async createAuditEvent(
    request: Request,
    response: Response,
    auditContext: any,
    responseTime: number,
    responseData?: any,
  ): Promise<void> {
    const eventType = this.determineEventType(request, response.statusCode);
    const category = this.determineCategory(request);
    const severity = this.determineSeverity(request, response.statusCode, eventType);

    await this.auditTrailService.createAuditEvent({
      eventType,
      category,
      severity,
      userId: auditContext.userId,
      userRole: auditContext.userRole,
      patientId: auditContext.patientId,
      description: this.generateDescription(request, response.statusCode, eventType),
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      resourceType: this.extractResourceType(request),
      resourceId: this.extractResourceId(request),
      endpoint: request.path,
      httpMethod: request.method,
      responseStatus: response.statusCode,
      responseTime,
      deviceType: auditContext.deviceType,
      clientApplication: auditContext.clientApplication,
      correlationId: auditContext.correlationId,
      additionalData: {
        query: this.sanitizeQuery(request.query),
        headers: this.sanitizeHeaders(request.headers),
        bodySize: request.get('Content-Length'),
        responseSize: response.get('Content-Length'),
        timestamp: new Date().toISOString(),
      },
      hipaaMetadata: this.buildHipaaMetadata(request),
      includeInComplianceReport: this.shouldIncludeInComplianceReport(request, category),
      requiresAlert: this.shouldTriggerAlert(severity, eventType),
      dataExported: this.isDataExport(request, responseData),
      recordsAffected: this.countAffectedRecords(responseData),
      sourceSystem: 'api-gateway',
    });
  }

  private async createErrorAuditEvent(
    request: Request,
    response: Response,
    auditContext: any,
    responseTime: number,
    error: any,
  ): Promise<void> {
    const eventType = this.determineErrorEventType(error);
    const severity = AuditSeverity.HIGH;

    await this.auditTrailService.createAuditEvent({
      eventType,
      category: AuditCategory.SECURITY,
      severity,
      userId: auditContext.userId,
      userRole: auditContext.userRole,
      patientId: auditContext.patientId,
      description: `Error occurred: ${error.message || 'Unknown error'}`,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      resourceType: this.extractResourceType(request),
      endpoint: request.path,
      httpMethod: request.method,
      responseStatus: error.status || 500,
      responseTime,
      deviceType: auditContext.deviceType,
      correlationId: auditContext.correlationId,
      additionalData: {
        errorStack: error.stack,
        errorCode: error.code,
        query: this.sanitizeQuery(request.query),
        timestamp: new Date().toISOString(),
      },
      requiresAlert: true,
      suspiciousActivity: this.isSuspiciousError(error),
      sourceSystem: 'api-gateway',
    });
  }

  private determineEventType(request: Request, statusCode: number): AuditEventType {
    const path = request.path.toLowerCase();
    const method = request.method;

    // Authentication events
    if (path.includes('/auth/login')) {
      return statusCode < 400 ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED;
    }
    if (path.includes('/auth/logout')) {
      return AuditEventType.LOGOUT;
    }

    // Patient data events
    if (path.includes('/patient')) {
      if (method === 'GET') return AuditEventType.PATIENT_DATA_VIEWED;
      if (method === 'POST') return AuditEventType.PATIENT_DATA_CREATED;
      if (method === 'PUT' || method === 'PATCH') return AuditEventType.PATIENT_DATA_UPDATED;
      if (method === 'DELETE') return AuditEventType.PATIENT_DATA_DELETED;
    }

    // File events
    if (path.includes('/files')) {
      if (method === 'POST') return AuditEventType.FILE_UPLOADED;
      if (method === 'GET') return AuditEventType.FILE_DOWNLOADED;
      if (method === 'DELETE') return AuditEventType.FILE_DELETED;
    }

    // Medical records
    if (path.includes('/medical-record')) {
      if (method === 'GET') return AuditEventType.MEDICAL_RECORD_ACCESSED;
      return AuditEventType.MEDICAL_RECORD_MODIFIED;
    }

    // Clinical notes
    if (path.includes('/notes')) {
      if (method === 'GET') return AuditEventType.CLINICAL_NOTES_VIEWED;
      if (method === 'POST') return AuditEventType.CLINICAL_NOTES_CREATED;
      return AuditEventType.CLINICAL_NOTES_UPDATED;
    }

    // Admin events
    if (path.includes('/admin/users')) {
      if (method === 'POST') return AuditEventType.USER_CREATED;
      if (method === 'PUT' || method === 'PATCH') return AuditEventType.USER_UPDATED;
      if (method === 'DELETE') return AuditEventType.USER_DELETED;
    }

    // Default based on HTTP method
    if (method === 'GET') return AuditEventType.PATIENT_DATA_VIEWED;
    if (method === 'POST') return AuditEventType.PATIENT_DATA_CREATED;
    if (method === 'PUT' || method === 'PATCH') return AuditEventType.PATIENT_DATA_UPDATED;
    if (method === 'DELETE') return AuditEventType.PATIENT_DATA_DELETED;

    return AuditEventType.PATIENT_DATA_VIEWED;
  }

  private determineCategory(request: Request): AuditCategory {
    const path = request.path.toLowerCase();

    if (path.includes('/auth')) return AuditCategory.AUTHENTICATION;
    if (path.includes('/admin')) return AuditCategory.ADMINISTRATIVE;
    if (path.includes('/files')) return AuditCategory.FILE_MANAGEMENT;
    if (path.includes('/billing') || path.includes('/payment')) return AuditCategory.FINANCIAL;
    if (path.includes('/ai') || path.includes('/analytics')) return AuditCategory.AI_ANALYTICS;
    if (path.includes('/patient') || path.includes('/medical') || path.includes('/clinical')) {
      return AuditCategory.CLINICAL;
    }

    return AuditCategory.DATA_ACCESS;
  }

  private determineSeverity(request: Request, statusCode: number, eventType: AuditEventType): AuditSeverity {
    // Critical severity for security events
    if (statusCode === 401 || statusCode === 403) return AuditSeverity.CRITICAL;
    if (statusCode >= 500) return AuditSeverity.HIGH;

    // High severity for patient data access
    if (request.path.includes('/patient') && request.method !== 'GET') {
      return AuditSeverity.HIGH;
    }

    // Medium severity for administrative actions
    if (request.path.includes('/admin')) return AuditSeverity.MEDIUM;

    // Default based on event type
    const highSeverityEvents = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.UNAUTHORIZED_ACCESS,
      AuditEventType.PATIENT_DATA_DELETED,
      AuditEventType.USER_DELETED,
    ];

    if (highSeverityEvents.includes(eventType)) return AuditSeverity.HIGH;

    return AuditSeverity.LOW;
  }

  private determineErrorEventType(error: any): AuditEventType {
    if (error.status === 401) return AuditEventType.UNAUTHORIZED_ACCESS;
    if (error.status === 403) return AuditEventType.UNAUTHORIZED_ACCESS;
    if (error.status === 429) return AuditEventType.RATE_LIMIT_EXCEEDED;
    if (error.message?.includes('token')) return AuditEventType.INVALID_TOKEN;
    if (error.message?.includes('SQL')) return AuditEventType.SQL_INJECTION_ATTEMPT;
    if (error.message?.includes('XSS') || error.message?.includes('script')) {
      return AuditEventType.XSS_ATTEMPT;
    }

    return AuditEventType.SUSPICIOUS_ACTIVITY;
  }

  private extractPatientId(request: Request): string | undefined {
    // Try multiple ways to extract patient ID
    const patientId = 
      request.params.patientId ||
      request.query.patientId ||
      request.body?.patientId ||
      request.headers['x-patient-id'];

    return patientId as string;
  }

  private extractResourceType(request: Request): string {
    const path = request.path.toLowerCase();
    
    if (path.includes('/patient')) return 'PATIENT';
    if (path.includes('/appointment')) return 'APPOINTMENT';
    if (path.includes('/files')) return 'FILE';
    if (path.includes('/notes')) return 'CLINICAL_NOTES';
    if (path.includes('/medical-record')) return 'MEDICAL_RECORD';
    if (path.includes('/user')) return 'USER';
    if (path.includes('/billing')) return 'BILLING';
    
    return 'UNKNOWN';
  }

  private extractResourceId(request: Request): string | undefined {
    // Extract ID from URL path
    const pathParts = request.path.split('/');
    const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    for (const part of pathParts) {
      if (idPattern.test(part)) {
        return part;
      }
    }
    
    return undefined;
  }

  private getClientIpAddress(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private detectDeviceType(userAgent?: string): DeviceType {
    if (!userAgent) return DeviceType.UNKNOWN;
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return DeviceType.MOBILE;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return DeviceType.TABLET;
    }
    if (ua.includes('kiosk')) {
      return DeviceType.KIOSK;
    }
    if (ua.includes('bot') || ua.includes('curl') || ua.includes('postman')) {
      return DeviceType.API_CLIENT;
    }
    
    return DeviceType.DESKTOP;
  }

  private detectClientApplication(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Postman')) return 'Postman';
    if (userAgent.includes('curl')) return 'curl';
    
    return 'unknown';
  }

  private generateDescription(request: Request, statusCode: number, eventType: AuditEventType): string {
    const method = request.method;
    const path = request.path;
    const status = statusCode >= 400 ? 'failed' : 'successful';
    
    return `${status} ${method} request to ${path} - ${eventType}`;
  }

  private sanitizeQuery(query: any): any {
    const sensitiveParams = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...query };
    
    for (const param of sensitiveParams) {
      if (sanitized[param]) {
        sanitized[param] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private buildHipaaMetadata(request: Request): any {
    return {
      accessPurpose: request.headers['x-access-purpose'] as string,
      minimumNecessary: request.headers['x-minimum-necessary'] === 'true',
      patientConsent: request.headers['x-patient-consent'] === 'true',
      emergencyAccess: request.headers['x-emergency-access'] === 'true',
      disclosureReason: request.headers['x-disclosure-reason'] as string,
    };
  }

  private shouldIncludeInComplianceReport(request: Request, category: AuditCategory): boolean {
    const complianceCategories = [
      AuditCategory.DATA_ACCESS,
      AuditCategory.CLINICAL,
      AuditCategory.ADMINISTRATIVE,
      AuditCategory.SECURITY,
    ];
    
    return complianceCategories.includes(category) || request.path.includes('/patient');
  }

  private shouldTriggerAlert(severity: AuditSeverity, eventType: AuditEventType): boolean {
    if (severity === AuditSeverity.CRITICAL) return true;
    
    const alertEvents = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.UNAUTHORIZED_ACCESS,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.DATA_BREACH_DETECTED,
    ];
    
    return alertEvents.includes(eventType);
  }

  private isDataExport(request: Request, responseData: any): boolean {
    const exportPaths = ['/export', '/download', '/report'];
    const isExportPath = exportPaths.some(path => request.path.includes(path));
    const isGetWithLargeResponse = request.method === 'GET' && 
      responseData && 
      Array.isArray(responseData) && 
      responseData.length > 10;
    
    return isExportPath || isGetWithLargeResponse;
  }

  private countAffectedRecords(responseData: any): number {
    if (!responseData) return 0;
    if (Array.isArray(responseData)) return responseData.length;
    if (responseData.count !== undefined) return responseData.count;
    if (responseData.total !== undefined) return responseData.total;
    return 1;
  }

  private isSuspiciousError(error: any): boolean {
    const suspiciousPatterns = [
      'SQL injection',
      'XSS',
      'script injection',
      'path traversal',
      'command injection',
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return suspiciousPatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
  }
}