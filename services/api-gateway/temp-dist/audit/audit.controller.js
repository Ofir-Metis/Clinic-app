"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@clinic/common");
const common_3 = require("@clinic/common");
let AuditController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Audit Trail'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(common_2.JwtAuthGuard, common_2.RolesGuard), (0, common_1.Controller)('audit')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createAuditEvent_decorators;
    let _searchAuditEvents_decorators;
    let _getAuditEvent_decorators;
    let _getAuditStatistics_decorators;
    let _exportAuditEvents_decorators;
    let _reviewAuditEvent_decorators;
    let _generateComplianceReport_decorators;
    let _getSuspiciousActivities_decorators;
    let _cleanupAuditEvents_decorators;
    let _getUserAuditTimeline_decorators;
    let _getPatientAccessLog_decorators;
    var AuditController = _classThis = class {
        constructor(auditTrailService) {
            this.auditTrailService = (__runInitializers(this, _instanceExtraInitializers), auditTrailService);
        }
        async createAuditEvent(createAuditEventDto, user) {
            // Log the creation of this audit event
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_EVENT_CREATED', { user, path: '/audit/events', method: 'POST' }, undefined, { manualEvent: true, createdBy: user.id });
            return this.auditTrailService.createAuditEvent(createAuditEventDto);
        }
        async searchAuditEvents(searchDto, user) {
            // Log audit log access
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_LOG_ACCESSED', { user, path: '/audit/events', method: 'GET' }, undefined, {
                searchCriteria: searchDto,
                accessedBy: user.id,
                accessTime: new Date(),
            });
            return this.auditTrailService.searchAuditEvents(searchDto);
        }
        async getAuditEvent(id, user) {
            // Log access to specific audit event
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_EVENT_ACCESSED', { user, path: `/audit/events/${id}`, method: 'GET' }, undefined, { auditEventId: id, accessedBy: user.id });
            // Note: You'll need to implement this method in the service
            return this.auditTrailService.findAuditEventById(id);
        }
        async getAuditStatistics(startDate, endDate, user) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Log statistics access
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_STATISTICS_ACCESSED', { user, path: '/audit/statistics', method: 'GET' }, undefined, {
                dateRange: { startDate: start, endDate: end },
                accessedBy: user.id,
            });
            return this.auditTrailService.getAuditStatistics(start, end);
        }
        async exportAuditEvents(startDate, endDate, format = 'csv', user, response) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Log export action
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_LOG_EXPORTED', { user, path: '/audit/export', method: 'GET' }, undefined, {
                exportFormat: format,
                dateRange: { startDate: start, endDate: end },
                exportedBy: user.id,
                exportTime: new Date(),
            });
            const exportData = await this.auditTrailService.exportAuditEvents(start, end, format);
            // Set appropriate headers
            const filename = `audit-export-${startDate}-${endDate}.${format}`;
            const contentType = format === 'csv' ? 'text/csv' : 'application/json';
            response.set({
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            });
            return new common_1.StreamableFile(Buffer.from(exportData));
        }
        async reviewAuditEvent(id, notes, user) {
            // Log the review action
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_EVENT_REVIEWED', { user, path: `/audit/events/${id}/review`, method: 'POST' }, undefined, {
                auditEventId: id,
                reviewNotes: notes,
                reviewedBy: user.id,
                reviewTime: new Date(),
            });
            // Update the audit event (you'll need to implement this method)
            await this.auditTrailService.markAuditEventAsReviewed(id, user.id, notes);
            return { message: 'Audit event marked as reviewed successfully' };
        }
        async generateComplianceReport(startDate, endDate, framework = 'HIPAA', user) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Log compliance report generation
            await this.auditTrailService.logAdministrativeAction(user.id, 'COMPLIANCE_REPORT_GENERATED', { user, path: '/audit/compliance-report', method: 'GET' }, undefined, {
                framework,
                dateRange: { startDate: start, endDate: end },
                generatedBy: user.id,
                generationTime: new Date(),
            });
            // Generate the compliance report (you'll need to implement this method)
            return this.auditTrailService.generateComplianceReport(start, end, framework);
        }
        async getSuspiciousActivities(days = 7, user) {
            // Log security review access
            await this.auditTrailService.logAdministrativeAction(user.id, 'SECURITY_REVIEW_ACCESSED', { user, path: '/audit/suspicious-activities', method: 'GET' }, undefined, {
                lookbackDays: days,
                accessedBy: user.id,
                securityReview: true,
            });
            // Get suspicious activities (you'll need to implement this method)
            return this.auditTrailService.getSuspiciousActivities(days);
        }
        async cleanupAuditEvents(retentionDays = 2555, user) {
            // Log cleanup action
            await this.auditTrailService.logAdministrativeAction(user.id, 'AUDIT_CLEANUP_INITIATED', { user, path: '/audit/cleanup', method: 'POST' }, undefined, {
                retentionDays,
                initiatedBy: user.id,
                cleanupTime: new Date(),
            });
            const deletedCount = await this.auditTrailService.cleanupOldAuditEvents(retentionDays);
            return {
                message: `Successfully cleaned up ${deletedCount} old audit events`,
                deletedCount,
            };
        }
        async getUserAuditTimeline(userId, days = 30, user) {
            // Log user timeline access
            await this.auditTrailService.logAdministrativeAction(user.id, 'USER_AUDIT_TIMELINE_ACCESSED', { user, path: `/audit/user/${userId}/timeline`, method: 'GET' }, userId, {
                targetUserId: userId,
                timelineDays: days,
                accessedBy: user.id,
            });
            // Get user audit timeline (you'll need to implement this method)
            return this.auditTrailService.getUserAuditTimeline(userId, days);
        }
        async getPatientAccessLog(patientId, days = 90, user) {
            // Log patient access log review
            await this.auditTrailService.logPatientDataAccess(user.id, patientId, 'PATIENT_ACCESS_LOG_REVIEWED', { user, path: `/audit/patient/${patientId}/access-log`, method: 'GET' }, 'ACCESS_LOG', undefined, {
                reviewDays: days,
                reviewedBy: user.id,
                hipaaCompliance: true,
            });
            // Get patient access log (you'll need to implement this method)
            return this.auditTrailService.getPatientAccessLog(patientId, days);
        }
    };
    __setFunctionName(_classThis, "AuditController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createAuditEvent_decorators = [(0, common_1.Post)('events'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Create a new audit event' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Audit event created successfully' }), (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED)];
        _searchAuditEvents_decorators = [(0, common_1.Get)('events'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Search audit events with filters' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'List of audit events' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'patientId', required: false, type: String }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
        _getAuditEvent_decorators = [(0, common_1.Get)('events/:id'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Get a specific audit event by ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit event details' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Audit event not found' })];
        _getAuditStatistics_decorators = [(0, common_1.Get)('statistics'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Get audit statistics for reporting' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit statistics' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String })];
        _exportAuditEvents_decorators = [(0, common_1.Get)('export'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Export audit events for compliance reporting' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit events exported successfully' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'format', required: false, enum: ['csv', 'json'], type: String })];
        _reviewAuditEvent_decorators = [(0, common_1.Post)('events/:id/review'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Mark an audit event as reviewed' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit event marked as reviewed' }), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _generateComplianceReport_decorators = [(0, common_1.Get)('compliance-report'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Generate HIPAA compliance report' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Compliance report generated' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }), (0, swagger_1.ApiQuery)({ name: 'framework', required: false, enum: ['HIPAA', 'GDPR', 'SOX'] })];
        _getSuspiciousActivities_decorators = [(0, common_1.Get)('suspicious-activities'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.SECURITY_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Get suspicious activities for security review' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'List of suspicious activities' }), (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number, description: 'Number of days to look back' })];
        _cleanupAuditEvents_decorators = [(0, common_1.Post)('cleanup'), (0, common_2.Roles)(common_3.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Clean up old audit events based on retention policy' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Cleanup completed' }), (0, swagger_1.ApiQuery)({ name: 'retentionDays', required: false, type: Number }), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _getUserAuditTimeline_decorators = [(0, common_1.Get)('user/:userId/timeline'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER), (0, swagger_1.ApiOperation)({ summary: 'Get audit timeline for a specific user' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'User audit timeline' })];
        _getPatientAccessLog_decorators = [(0, common_1.Get)('patient/:patientId/access-log'), (0, common_2.Roles)(common_3.UserRole.ADMIN, common_3.UserRole.SUPER_ADMIN, common_3.UserRole.COMPLIANCE_OFFICER, common_3.UserRole.THERAPIST), (0, swagger_1.ApiOperation)({ summary: 'Get patient data access log for HIPAA compliance' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient access log' })];
        __esDecorate(_classThis, null, _createAuditEvent_decorators, { kind: "method", name: "createAuditEvent", static: false, private: false, access: { has: obj => "createAuditEvent" in obj, get: obj => obj.createAuditEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchAuditEvents_decorators, { kind: "method", name: "searchAuditEvents", static: false, private: false, access: { has: obj => "searchAuditEvents" in obj, get: obj => obj.searchAuditEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditEvent_decorators, { kind: "method", name: "getAuditEvent", static: false, private: false, access: { has: obj => "getAuditEvent" in obj, get: obj => obj.getAuditEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditStatistics_decorators, { kind: "method", name: "getAuditStatistics", static: false, private: false, access: { has: obj => "getAuditStatistics" in obj, get: obj => obj.getAuditStatistics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportAuditEvents_decorators, { kind: "method", name: "exportAuditEvents", static: false, private: false, access: { has: obj => "exportAuditEvents" in obj, get: obj => obj.exportAuditEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reviewAuditEvent_decorators, { kind: "method", name: "reviewAuditEvent", static: false, private: false, access: { has: obj => "reviewAuditEvent" in obj, get: obj => obj.reviewAuditEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateComplianceReport_decorators, { kind: "method", name: "generateComplianceReport", static: false, private: false, access: { has: obj => "generateComplianceReport" in obj, get: obj => obj.generateComplianceReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSuspiciousActivities_decorators, { kind: "method", name: "getSuspiciousActivities", static: false, private: false, access: { has: obj => "getSuspiciousActivities" in obj, get: obj => obj.getSuspiciousActivities }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cleanupAuditEvents_decorators, { kind: "method", name: "cleanupAuditEvents", static: false, private: false, access: { has: obj => "cleanupAuditEvents" in obj, get: obj => obj.cleanupAuditEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserAuditTimeline_decorators, { kind: "method", name: "getUserAuditTimeline", static: false, private: false, access: { has: obj => "getUserAuditTimeline" in obj, get: obj => obj.getUserAuditTimeline }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPatientAccessLog_decorators, { kind: "method", name: "getPatientAccessLog", static: false, private: false, access: { has: obj => "getPatientAccessLog" in obj, get: obj => obj.getPatientAccessLog }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditController = _classThis;
})();
exports.AuditController = AuditController;
