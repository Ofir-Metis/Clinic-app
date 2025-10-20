"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_enums_1 = require("../enums/audit.enums");
let AuditInterceptor = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditInterceptor = _classThis = class {
        constructor(auditTrailService) {
            this.auditTrailService = auditTrailService;
            this.logger = new common_1.Logger(AuditInterceptor.name);
        }
        intercept(context, next) {
            const request = context.switchToHttp().getRequest();
            const response = context.switchToHttp().getResponse();
            const startTime = Date.now();
            // Skip audit for certain endpoints to prevent log spam
            if (this.shouldSkipAudit(request)) {
                return next.handle();
            }
            const auditContext = this.buildAuditContext(request);
            return next.handle().pipe((0, operators_1.tap)((data) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                // Create audit event for successful requests
                this.createAuditEvent(request, response, auditContext, responseTime, data).catch((error) => {
                    this.logger.error('Failed to create audit event', error.stack);
                });
            }), (0, operators_1.catchError)((error) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                // Create audit event for failed requests
                this.createErrorAuditEvent(request, response, auditContext, responseTime, error).catch((auditError) => {
                    this.logger.error('Failed to create error audit event', auditError.stack);
                });
                throw error;
            }));
        }
        shouldSkipAudit(request) {
            const skipPaths = [
                '/health',
                '/metrics',
                '/favicon.ico',
                '/audit/events', // Prevent recursive auditing
            ];
            const skipMethods = ['OPTIONS'];
            return (skipPaths.some(path => request.path.includes(path)) ||
                skipMethods.includes(request.method) ||
                request.path.includes('/static/') ||
                request.path.includes('/assets/'));
        }
        buildAuditContext(request) {
            return {
                userId: request.user?.id,
                userRole: request.user?.role,
                patientId: this.extractPatientId(request),
                sessionId: request.sessionID,
                ipAddress: this.getClientIpAddress(request),
                userAgent: request.get('User-Agent'),
                deviceType: this.detectDeviceType(request.get('User-Agent')),
                clientApplication: this.detectClientApplication(request.get('User-Agent')),
                correlationId: request.headers['x-correlation-id'],
            };
        }
        async createAuditEvent(request, response, auditContext, responseTime, responseData) {
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
        async createErrorAuditEvent(request, response, auditContext, responseTime, error) {
            const eventType = this.determineErrorEventType(error);
            const severity = audit_enums_1.AuditSeverity.HIGH;
            await this.auditTrailService.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.SECURITY,
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
        determineEventType(request, statusCode) {
            const path = request.path.toLowerCase();
            const method = request.method;
            // Authentication events
            if (path.includes('/auth/login')) {
                return statusCode < 400 ? audit_enums_1.AuditEventType.LOGIN_SUCCESS : audit_enums_1.AuditEventType.LOGIN_FAILED;
            }
            if (path.includes('/auth/logout')) {
                return audit_enums_1.AuditEventType.LOGOUT;
            }
            // Patient data events
            if (path.includes('/patient')) {
                if (method === 'GET')
                    return audit_enums_1.AuditEventType.PATIENT_DATA_VIEWED;
                if (method === 'POST')
                    return audit_enums_1.AuditEventType.PATIENT_DATA_CREATED;
                if (method === 'PUT' || method === 'PATCH')
                    return audit_enums_1.AuditEventType.PATIENT_DATA_UPDATED;
                if (method === 'DELETE')
                    return audit_enums_1.AuditEventType.PATIENT_DATA_DELETED;
            }
            // File events
            if (path.includes('/files')) {
                if (method === 'POST')
                    return audit_enums_1.AuditEventType.FILE_UPLOADED;
                if (method === 'GET')
                    return audit_enums_1.AuditEventType.FILE_DOWNLOADED;
                if (method === 'DELETE')
                    return audit_enums_1.AuditEventType.FILE_DELETED;
            }
            // Medical records
            if (path.includes('/medical-record')) {
                if (method === 'GET')
                    return audit_enums_1.AuditEventType.MEDICAL_RECORD_ACCESSED;
                return audit_enums_1.AuditEventType.MEDICAL_RECORD_MODIFIED;
            }
            // Clinical notes
            if (path.includes('/notes')) {
                if (method === 'GET')
                    return audit_enums_1.AuditEventType.CLINICAL_NOTES_VIEWED;
                if (method === 'POST')
                    return audit_enums_1.AuditEventType.CLINICAL_NOTES_CREATED;
                return audit_enums_1.AuditEventType.CLINICAL_NOTES_UPDATED;
            }
            // Admin events
            if (path.includes('/admin/users')) {
                if (method === 'POST')
                    return audit_enums_1.AuditEventType.USER_CREATED;
                if (method === 'PUT' || method === 'PATCH')
                    return audit_enums_1.AuditEventType.USER_UPDATED;
                if (method === 'DELETE')
                    return audit_enums_1.AuditEventType.USER_DELETED;
            }
            // Default based on HTTP method
            if (method === 'GET')
                return audit_enums_1.AuditEventType.PATIENT_DATA_VIEWED;
            if (method === 'POST')
                return audit_enums_1.AuditEventType.PATIENT_DATA_CREATED;
            if (method === 'PUT' || method === 'PATCH')
                return audit_enums_1.AuditEventType.PATIENT_DATA_UPDATED;
            if (method === 'DELETE')
                return audit_enums_1.AuditEventType.PATIENT_DATA_DELETED;
            return audit_enums_1.AuditEventType.PATIENT_DATA_VIEWED;
        }
        determineCategory(request) {
            const path = request.path.toLowerCase();
            if (path.includes('/auth'))
                return audit_enums_1.AuditCategory.AUTHENTICATION;
            if (path.includes('/admin'))
                return audit_enums_1.AuditCategory.ADMINISTRATIVE;
            if (path.includes('/files'))
                return audit_enums_1.AuditCategory.FILE_MANAGEMENT;
            if (path.includes('/billing') || path.includes('/payment'))
                return audit_enums_1.AuditCategory.FINANCIAL;
            if (path.includes('/ai') || path.includes('/analytics'))
                return audit_enums_1.AuditCategory.AI_ANALYTICS;
            if (path.includes('/patient') || path.includes('/medical') || path.includes('/clinical')) {
                return audit_enums_1.AuditCategory.CLINICAL;
            }
            return audit_enums_1.AuditCategory.DATA_ACCESS;
        }
        determineSeverity(request, statusCode, eventType) {
            // Critical severity for security events
            if (statusCode === 401 || statusCode === 403)
                return audit_enums_1.AuditSeverity.CRITICAL;
            if (statusCode >= 500)
                return audit_enums_1.AuditSeverity.HIGH;
            // High severity for patient data access
            if (request.path.includes('/patient') && request.method !== 'GET') {
                return audit_enums_1.AuditSeverity.HIGH;
            }
            // Medium severity for administrative actions
            if (request.path.includes('/admin'))
                return audit_enums_1.AuditSeverity.MEDIUM;
            // Default based on event type
            const highSeverityEvents = [
                audit_enums_1.AuditEventType.LOGIN_FAILED,
                audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS,
                audit_enums_1.AuditEventType.PATIENT_DATA_DELETED,
                audit_enums_1.AuditEventType.USER_DELETED,
            ];
            if (highSeverityEvents.includes(eventType))
                return audit_enums_1.AuditSeverity.HIGH;
            return audit_enums_1.AuditSeverity.LOW;
        }
        determineErrorEventType(error) {
            if (error.status === 401)
                return audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS;
            if (error.status === 403)
                return audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS;
            if (error.status === 429)
                return audit_enums_1.AuditEventType.RATE_LIMIT_EXCEEDED;
            if (error.message?.includes('token'))
                return audit_enums_1.AuditEventType.INVALID_TOKEN;
            if (error.message?.includes('SQL'))
                return audit_enums_1.AuditEventType.SQL_INJECTION_ATTEMPT;
            if (error.message?.includes('XSS') || error.message?.includes('script')) {
                return audit_enums_1.AuditEventType.XSS_ATTEMPT;
            }
            return audit_enums_1.AuditEventType.SUSPICIOUS_ACTIVITY;
        }
        extractPatientId(request) {
            // Try multiple ways to extract patient ID
            const patientId = request.params.patientId ||
                request.query.patientId ||
                request.body?.patientId ||
                request.headers['x-patient-id'];
            return patientId;
        }
        extractResourceType(request) {
            const path = request.path.toLowerCase();
            if (path.includes('/patient'))
                return 'PATIENT';
            if (path.includes('/appointment'))
                return 'APPOINTMENT';
            if (path.includes('/files'))
                return 'FILE';
            if (path.includes('/notes'))
                return 'CLINICAL_NOTES';
            if (path.includes('/medical-record'))
                return 'MEDICAL_RECORD';
            if (path.includes('/user'))
                return 'USER';
            if (path.includes('/billing'))
                return 'BILLING';
            return 'UNKNOWN';
        }
        extractResourceId(request) {
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
        getClientIpAddress(request) {
            return (request.headers['x-forwarded-for'] ||
                request.headers['x-real-ip'] ||
                request.connection.remoteAddress ||
                request.socket.remoteAddress ||
                'unknown');
        }
        detectDeviceType(userAgent) {
            if (!userAgent)
                return audit_enums_1.DeviceType.UNKNOWN;
            const ua = userAgent.toLowerCase();
            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
                return audit_enums_1.DeviceType.MOBILE;
            }
            if (ua.includes('tablet') || ua.includes('ipad')) {
                return audit_enums_1.DeviceType.TABLET;
            }
            if (ua.includes('kiosk')) {
                return audit_enums_1.DeviceType.KIOSK;
            }
            if (ua.includes('bot') || ua.includes('curl') || ua.includes('postman')) {
                return audit_enums_1.DeviceType.API_CLIENT;
            }
            return audit_enums_1.DeviceType.DESKTOP;
        }
        detectClientApplication(userAgent) {
            if (!userAgent)
                return 'unknown';
            if (userAgent.includes('Chrome'))
                return 'Chrome';
            if (userAgent.includes('Firefox'))
                return 'Firefox';
            if (userAgent.includes('Safari'))
                return 'Safari';
            if (userAgent.includes('Edge'))
                return 'Edge';
            if (userAgent.includes('Postman'))
                return 'Postman';
            if (userAgent.includes('curl'))
                return 'curl';
            return 'unknown';
        }
        generateDescription(request, statusCode, eventType) {
            const method = request.method;
            const path = request.path;
            const status = statusCode >= 400 ? 'failed' : 'successful';
            return `${status} ${method} request to ${path} - ${eventType}`;
        }
        sanitizeQuery(query) {
            const sensitiveParams = ['password', 'token', 'secret', 'key', 'auth'];
            const sanitized = { ...query };
            for (const param of sensitiveParams) {
                if (sanitized[param]) {
                    sanitized[param] = '[REDACTED]';
                }
            }
            return sanitized;
        }
        sanitizeHeaders(headers) {
            const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
            const sanitized = { ...headers };
            for (const header of sensitiveHeaders) {
                if (sanitized[header]) {
                    sanitized[header] = '[REDACTED]';
                }
            }
            return sanitized;
        }
        buildHipaaMetadata(request) {
            return {
                accessPurpose: request.headers['x-access-purpose'],
                minimumNecessary: request.headers['x-minimum-necessary'] === 'true',
                patientConsent: request.headers['x-patient-consent'] === 'true',
                emergencyAccess: request.headers['x-emergency-access'] === 'true',
                disclosureReason: request.headers['x-disclosure-reason'],
            };
        }
        shouldIncludeInComplianceReport(request, category) {
            const complianceCategories = [
                audit_enums_1.AuditCategory.DATA_ACCESS,
                audit_enums_1.AuditCategory.CLINICAL,
                audit_enums_1.AuditCategory.ADMINISTRATIVE,
                audit_enums_1.AuditCategory.SECURITY,
            ];
            return complianceCategories.includes(category) || request.path.includes('/patient');
        }
        shouldTriggerAlert(severity, eventType) {
            if (severity === audit_enums_1.AuditSeverity.CRITICAL)
                return true;
            const alertEvents = [
                audit_enums_1.AuditEventType.LOGIN_FAILED,
                audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS,
                audit_enums_1.AuditEventType.SUSPICIOUS_ACTIVITY,
                audit_enums_1.AuditEventType.DATA_BREACH_DETECTED,
            ];
            return alertEvents.includes(eventType);
        }
        isDataExport(request, responseData) {
            const exportPaths = ['/export', '/download', '/report'];
            const isExportPath = exportPaths.some(path => request.path.includes(path));
            const isGetWithLargeResponse = request.method === 'GET' &&
                responseData &&
                Array.isArray(responseData) &&
                responseData.length > 10;
            return isExportPath || isGetWithLargeResponse;
        }
        countAffectedRecords(responseData) {
            if (!responseData)
                return 0;
            if (Array.isArray(responseData))
                return responseData.length;
            if (responseData.count !== undefined)
                return responseData.count;
            if (responseData.total !== undefined)
                return responseData.total;
            return 1;
        }
        isSuspiciousError(error) {
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
    };
    __setFunctionName(_classThis, "AuditInterceptor");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditInterceptor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditInterceptor = _classThis;
})();
exports.AuditInterceptor = AuditInterceptor;
