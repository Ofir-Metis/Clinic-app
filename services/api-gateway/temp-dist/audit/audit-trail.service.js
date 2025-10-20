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
exports.AuditTrailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_event_entity_1 = require("./entities/audit-event.entity");
const audit_enums_1 = require("./enums/audit.enums");
let AuditTrailService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditTrailService = _classThis = class {
        constructor(auditEventRepository) {
            this.auditEventRepository = auditEventRepository;
            this.logger = new common_1.Logger(AuditTrailService.name);
        }
        /**
         * Create a new audit event for HIPAA compliance tracking
         */
        async createAuditEvent(dto) {
            try {
                const auditEvent = this.auditEventRepository.create({
                    ...dto,
                    timestamp: new Date(),
                    id: this.generateAuditId(),
                });
                const savedEvent = await this.auditEventRepository.save(auditEvent);
                // Log critical events immediately
                if (dto.severity === audit_enums_1.AuditSeverity.CRITICAL || dto.severity === audit_enums_1.AuditSeverity.HIGH) {
                    this.logger.warn(`AUDIT EVENT: ${dto.eventType} - ${dto.description}`, {
                        auditId: savedEvent.id,
                        userId: dto.userId,
                        patientId: dto.patientId,
                        ipAddress: dto.ipAddress,
                    });
                }
                return savedEvent;
            }
            catch (error) {
                this.logger.error('Failed to create audit event', error.stack);
                throw error;
            }
        }
        /**
         * Log user authentication events
         */
        async logAuthenticationEvent(userId, eventType, request, additionalData) {
            return this.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.AUTHENTICATION,
                severity: eventType === audit_enums_1.AuditEventType.LOGIN_FAILED ? audit_enums_1.AuditSeverity.MEDIUM : audit_enums_1.AuditSeverity.LOW,
                userId,
                userRole: request.user?.role,
                description: this.getAuthEventDescription(eventType),
                ipAddress: this.getClientIpAddress(request),
                userAgent: request.get('User-Agent'),
                sessionId: request.sessionID,
                resourceType: 'AUTH',
                endpoint: request.path,
                httpMethod: request.method,
                additionalData: {
                    ...additionalData,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        /**
         * Log patient data access events (HIPAA critical)
         */
        async logPatientDataAccess(userId, patientId, eventType, request, resourceType, resourceId, additionalData) {
            return this.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.DATA_ACCESS,
                severity: audit_enums_1.AuditSeverity.HIGH,
                userId,
                patientId,
                userRole: request.user?.role,
                description: `Patient data ${eventType.toLowerCase()} - ${resourceType}`,
                ipAddress: this.getClientIpAddress(request),
                userAgent: request.get('User-Agent'),
                sessionId: request.sessionID,
                resourceType,
                resourceId,
                endpoint: request.path,
                httpMethod: request.method,
                additionalData: {
                    ...additionalData,
                    dataTypes: this.extractDataTypes(request),
                    accessReason: request.headers['x-access-reason'],
                    timestamp: new Date().toISOString(),
                },
            });
        }
        /**
         * Log administrative actions
         */
        async logAdministrativeAction(userId, eventType, request, targetUserId, additionalData) {
            return this.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.ADMINISTRATIVE,
                severity: audit_enums_1.AuditSeverity.MEDIUM,
                userId,
                targetUserId,
                userRole: request.user?.role,
                description: this.getAdminEventDescription(eventType, targetUserId),
                ipAddress: this.getClientIpAddress(request),
                userAgent: request.get('User-Agent'),
                sessionId: request.sessionID,
                resourceType: 'ADMIN',
                endpoint: request.path,
                httpMethod: request.method,
                additionalData: {
                    ...additionalData,
                    adminAction: true,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        /**
         * Log system security events
         */
        async logSecurityEvent(eventType, request, severity = audit_enums_1.AuditSeverity.HIGH, additionalData) {
            return this.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.SECURITY,
                severity,
                userId: request.user?.id,
                userRole: request.user?.role,
                description: this.getSecurityEventDescription(eventType),
                ipAddress: this.getClientIpAddress(request),
                userAgent: request.get('User-Agent'),
                sessionId: request.sessionID,
                resourceType: 'SECURITY',
                endpoint: request.path,
                httpMethod: request.method,
                additionalData: {
                    ...additionalData,
                    securityAlert: true,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        /**
         * Log system events and errors
         */
        async logSystemEvent(eventType, severity, description, additionalData) {
            return this.createAuditEvent({
                eventType,
                category: audit_enums_1.AuditCategory.SYSTEM,
                severity,
                description,
                resourceType: 'SYSTEM',
                additionalData: {
                    ...additionalData,
                    systemEvent: true,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        /**
         * Search audit events with filters
         */
        async searchAuditEvents(searchDto) {
            const { startDate, endDate, userId, patientId, eventType, category, severity, resourceType, ipAddress, page = 1, limit = 50, } = searchDto;
            const queryBuilder = this.auditEventRepository.createQueryBuilder('audit');
            // Date range filter (required for performance)
            if (startDate) {
                queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate });
            }
            if (endDate) {
                queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate });
            }
            // User filters
            if (userId) {
                queryBuilder.andWhere('audit.userId = :userId', { userId });
            }
            if (patientId) {
                queryBuilder.andWhere('audit.patientId = :patientId', { patientId });
            }
            // Event filters
            if (eventType) {
                queryBuilder.andWhere('audit.eventType = :eventType', { eventType });
            }
            if (category) {
                queryBuilder.andWhere('audit.category = :category', { category });
            }
            if (severity) {
                queryBuilder.andWhere('audit.severity = :severity', { severity });
            }
            if (resourceType) {
                queryBuilder.andWhere('audit.resourceType = :resourceType', { resourceType });
            }
            // Network filter
            if (ipAddress) {
                queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
            }
            // Pagination
            const offset = (page - 1) * limit;
            queryBuilder
                .orderBy('audit.timestamp', 'DESC')
                .skip(offset)
                .take(limit);
            const [events, total] = await queryBuilder.getManyAndCount();
            return {
                events,
                total,
                page,
                limit,
            };
        }
        /**
         * Get audit statistics for reporting
         */
        async getAuditStatistics(startDate, endDate) {
            const queryBuilder = this.auditEventRepository.createQueryBuilder('audit');
            queryBuilder.where('audit.timestamp BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
            const [totalEvents, eventsByCategory, eventsBySeverity, topUsers] = await Promise.all([
                // Total events
                queryBuilder.getCount(),
                // Events by category
                queryBuilder
                    .select('audit.category', 'category')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('audit.category')
                    .getRawMany(),
                // Events by severity
                queryBuilder
                    .select('audit.severity', 'severity')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('audit.severity')
                    .getRawMany(),
                // Top users
                queryBuilder
                    .select('audit.userId', 'userId')
                    .addSelect('COUNT(*)', 'count')
                    .where('audit.userId IS NOT NULL')
                    .groupBy('audit.userId')
                    .orderBy('COUNT(*)', 'DESC')
                    .limit(10)
                    .getRawMany(),
            ]);
            const securityEvents = await queryBuilder
                .andWhere('audit.category = :category', { category: audit_enums_1.AuditCategory.SECURITY })
                .getCount();
            const patientAccessEvents = await queryBuilder
                .andWhere('audit.patientId IS NOT NULL')
                .getCount();
            return {
                totalEvents,
                eventsByCategory: this.mapArrayToObject(eventsByCategory, 'category', 'count'),
                eventsBySeverity: this.mapArrayToObject(eventsBySeverity, 'severity', 'count'),
                topUsers: topUsers.map(user => ({ userId: user.userId, count: parseInt(user.count) })),
                securityEvents,
                patientAccessEvents,
            };
        }
        /**
         * Export audit events for compliance reporting
         */
        async exportAuditEvents(startDate, endDate, format = 'csv') {
            const events = await this.auditEventRepository.find({
                where: {
                    timestamp: this.createBetweenCondition(startDate, endDate),
                },
                order: {
                    timestamp: 'DESC',
                },
            });
            if (format === 'json') {
                return JSON.stringify(events, null, 2);
            }
            // CSV format
            const headers = [
                'ID', 'Timestamp', 'Event Type', 'Category', 'Severity',
                'User ID', 'User Role', 'Patient ID', 'IP Address',
                'Resource Type', 'Endpoint', 'HTTP Method', 'Description'
            ];
            const csvRows = [
                headers.join(','),
                ...events.map(event => [
                    event.id,
                    event.timestamp.toISOString(),
                    event.eventType,
                    event.category,
                    event.severity,
                    event.userId || '',
                    event.userRole || '',
                    event.patientId || '',
                    event.ipAddress || '',
                    event.resourceType || '',
                    event.endpoint || '',
                    event.httpMethod || '',
                    `"${event.description.replace(/"/g, '""')}"`,
                ].join(','))
            ];
            return csvRows.join('\n');
        }
        /**
         * Clean up old audit events based on retention policy
         */
        async cleanupOldAuditEvents(retentionDays) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const result = await this.auditEventRepository
                .createQueryBuilder()
                .delete()
                .from(audit_event_entity_1.AuditEvent)
                .where('timestamp < :cutoffDate', { cutoffDate })
                .execute();
            this.logger.log(`Cleaned up ${result.affected} audit events older than ${retentionDays} days`);
            return result.affected || 0;
        }
        // Private helper methods
        generateAuditId() {
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2, 8);
            return `AUD_${timestamp}_${randomPart}`.toUpperCase();
        }
        getClientIpAddress(request) {
            return (request.headers['x-forwarded-for'] ||
                request.headers['x-real-ip'] ||
                request.connection.remoteAddress ||
                request.socket.remoteAddress ||
                'unknown');
        }
        getAuthEventDescription(eventType) {
            const descriptions = {
                [audit_enums_1.AuditEventType.LOGIN_SUCCESS]: 'User successfully authenticated',
                [audit_enums_1.AuditEventType.LOGIN_FAILED]: 'User authentication failed',
                [audit_enums_1.AuditEventType.LOGOUT]: 'User logged out',
                [audit_enums_1.AuditEventType.PASSWORD_CHANGED]: 'User password changed',
                [audit_enums_1.AuditEventType.MFA_ENABLED]: 'Multi-factor authentication enabled',
                [audit_enums_1.AuditEventType.MFA_DISABLED]: 'Multi-factor authentication disabled',
            };
            return descriptions[eventType] || 'Authentication event';
        }
        getAdminEventDescription(eventType, targetUserId) {
            const target = targetUserId ? ` for user ${targetUserId}` : '';
            const descriptions = {
                [audit_enums_1.AuditEventType.USER_CREATED]: `User account created${target}`,
                [audit_enums_1.AuditEventType.USER_UPDATED]: `User account updated${target}`,
                [audit_enums_1.AuditEventType.USER_DELETED]: `User account deleted${target}`,
                [audit_enums_1.AuditEventType.ROLE_CHANGED]: `User role changed${target}`,
                [audit_enums_1.AuditEventType.PERMISSION_GRANTED]: `Permission granted${target}`,
                [audit_enums_1.AuditEventType.PERMISSION_REVOKED]: `Permission revoked${target}`,
            };
            return descriptions[eventType] || `Administrative action${target}`;
        }
        getSecurityEventDescription(eventType) {
            const descriptions = {
                [audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS]: 'Unauthorized access attempt',
                [audit_enums_1.AuditEventType.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
                [audit_enums_1.AuditEventType.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
                [audit_enums_1.AuditEventType.INVALID_TOKEN]: 'Invalid authentication token',
                [audit_enums_1.AuditEventType.CSRF_DETECTED]: 'Cross-site request forgery detected',
            };
            return descriptions[eventType] || 'Security event';
        }
        extractDataTypes(request) {
            const dataTypes = [];
            const path = request.path.toLowerCase();
            if (path.includes('patient'))
                dataTypes.push('patient_data');
            if (path.includes('medical'))
                dataTypes.push('medical_records');
            if (path.includes('appointment'))
                dataTypes.push('appointment_data');
            if (path.includes('note'))
                dataTypes.push('clinical_notes');
            if (path.includes('file') || path.includes('document'))
                dataTypes.push('documents');
            return dataTypes;
        }
        mapArrayToObject(array, keyField, valueField) {
            return array.reduce((acc, item) => {
                acc[item[keyField]] = parseInt(item[valueField]);
                return acc;
            }, {});
        }
        /**
         * Find audit event by ID
         */
        async findAuditEventById(id) {
            const auditEvent = await this.auditEventRepository.findOne({
                where: { id },
            });
            if (!auditEvent) {
                throw new Error(`Audit event with ID ${id} not found`);
            }
            return auditEvent;
        }
        /**
         * Mark audit event as reviewed
         */
        async markAuditEventAsReviewed(id, reviewedBy, notes) {
            const auditEvent = await this.findAuditEventById(id);
            auditEvent.reviewed = true;
            auditEvent.reviewedBy = reviewedBy;
            auditEvent.reviewedAt = new Date();
            auditEvent.reviewNotes = notes;
            return this.auditEventRepository.save(auditEvent);
        }
        /**
         * Generate compliance report
         */
        async generateComplianceReport(startDate, endDate, framework) {
            const reportId = `RPT_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
            const statistics = await this.getAuditStatistics(startDate, endDate);
            const suspiciousEvents = await this.auditEventRepository.find({
                where: {
                    timestamp: this.createBetweenCondition(startDate, endDate),
                    suspiciousActivity: true,
                },
                order: { timestamp: 'DESC' },
            });
            const violations = suspiciousEvents.map(event => ({
                id: event.id,
                type: event.eventType,
                severity: event.severity,
                description: event.description,
                timestamp: event.timestamp,
                userId: event.userId,
                patientId: event.patientId,
            }));
            const recommendations = this.generateComplianceRecommendations(statistics, violations);
            return {
                reportId,
                framework,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
                summary: {
                    ...statistics,
                    complianceScore: this.calculateComplianceScore(statistics, violations),
                    violationsCount: violations.length,
                },
                violations,
                recommendations,
            };
        }
        /**
         * Get suspicious activities
         */
        async getSuspiciousActivities(days) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const endDate = new Date();
            const activities = await this.auditEventRepository.find({
                where: {
                    timestamp: this.createBetweenCondition(startDate, endDate),
                    suspiciousActivity: true,
                },
                order: { timestamp: 'DESC' },
                take: 100,
            });
            const patterns = await this.identifyPatterns(activities);
            const recommendations = this.generateSecurityRecommendations(activities, patterns);
            return {
                activities,
                patterns,
                recommendations,
            };
        }
        /**
         * Get user audit timeline
         */
        async getUserAuditTimeline(userId, days) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const endDate = new Date();
            const events = await this.auditEventRepository.find({
                where: {
                    userId,
                    timestamp: this.createBetweenCondition(startDate, endDate),
                },
                order: { timestamp: 'DESC' },
                take: 500,
            });
            const summary = {
                totalEvents: events.length,
                eventsByType: this.groupEventsByField(events, 'eventType'),
                eventsByCategory: this.groupEventsByField(events, 'category'),
                loginAttempts: events.filter(e => e.eventType.includes('LOGIN')).length,
                patientAccesses: events.filter(e => e.patientId).length,
                suspiciousActivities: events.filter(e => e.suspiciousActivity).length,
            };
            return {
                userId,
                events,
                summary,
            };
        }
        /**
         * Get patient access log
         */
        async getPatientAccessLog(patientId, days) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const endDate = new Date();
            const accessEvents = await this.auditEventRepository.find({
                where: {
                    patientId,
                    timestamp: this.createBetweenCondition(startDate, endDate),
                },
                order: { timestamp: 'DESC' },
            });
            const uniqueUsers = [...new Set(accessEvents.map(e => e.userId).filter(Boolean))].length;
            const dataTypes = [...new Set(accessEvents.map(e => e.resourceType).filter(Boolean))];
            const emergencyAccesses = accessEvents.filter(e => e.hipaaMetadata?.emergencyAccess).length;
            return {
                patientId,
                accessEvents,
                summary: {
                    totalAccesses: accessEvents.length,
                    uniqueUsers,
                    dataTypes,
                    emergencyAccesses,
                },
            };
        }
        // Private helper methods for new functionality
        createBetweenCondition(from, to) {
            return (0, typeorm_1.Between)(from, to);
        }
        generateComplianceRecommendations(statistics, violations) {
            const recommendations = [];
            if (violations.length > 10) {
                recommendations.push('Consider implementing additional security monitoring');
            }
            if (statistics.securityEvents > statistics.totalEvents * 0.1) {
                recommendations.push('High number of security events detected - review access controls');
            }
            if (statistics.patientAccessEvents > statistics.totalEvents * 0.8) {
                recommendations.push('Review patient data access patterns for compliance');
            }
            recommendations.push('Regularly review and update audit retention policies');
            recommendations.push('Ensure all staff complete HIPAA compliance training');
            return recommendations;
        }
        calculateComplianceScore(statistics, violations) {
            let score = 100;
            // Deduct points for violations
            score -= violations.length * 2;
            // Deduct points for high security event ratio
            const securityRatio = statistics.securityEvents / statistics.totalEvents;
            if (securityRatio > 0.1) {
                score -= (securityRatio - 0.1) * 100;
            }
            return Math.max(0, Math.min(100, score));
        }
        async identifyPatterns(activities) {
            const patterns = [];
            // IP address patterns
            const ipCounts = this.groupEventsByField(activities, 'ipAddress');
            for (const [ip, count] of Object.entries(ipCounts)) {
                if (count > 10) {
                    patterns.push({
                        type: 'high_activity_ip',
                        value: ip,
                        count,
                        risk: 'medium',
                    });
                }
            }
            // User patterns
            const userCounts = this.groupEventsByField(activities, 'userId');
            for (const [userId, count] of Object.entries(userCounts)) {
                if (count > 20) {
                    patterns.push({
                        type: 'high_activity_user',
                        value: userId,
                        count,
                        risk: 'low',
                    });
                }
            }
            return patterns;
        }
        generateSecurityRecommendations(activities, patterns) {
            const recommendations = [];
            if (patterns.some(p => p.risk === 'high')) {
                recommendations.push('Immediate investigation required for high-risk patterns');
            }
            if (activities.some(a => a.eventType === audit_enums_1.AuditEventType.UNAUTHORIZED_ACCESS)) {
                recommendations.push('Review and strengthen access controls');
            }
            if (patterns.some(p => p.type === 'high_activity_ip')) {
                recommendations.push('Consider implementing IP-based rate limiting');
            }
            recommendations.push('Regular security awareness training for staff');
            recommendations.push('Implement additional monitoring for suspicious patterns');
            return recommendations;
        }
        groupEventsByField(events, field) {
            return events.reduce((acc, event) => {
                const value = event[field];
                if (value) {
                    acc[value] = (acc[value] || 0) + 1;
                }
                return acc;
            }, {});
        }
    };
    __setFunctionName(_classThis, "AuditTrailService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditTrailService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditTrailService = _classThis;
})();
exports.AuditTrailService = AuditTrailService;
