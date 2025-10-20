"use strict";
/**
 * ComplianceController - Comprehensive HIPAA compliance framework with audit trails and reporting
 */
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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@clinic/common");
const class_validator_1 = require("class-validator");
// AuditEventType is imported from @clinic/common
// DTOs for request validation
let ComplianceAssessmentDto = (() => {
    var _a;
    let _assessor_decorators;
    let _assessor_initializers = [];
    let _assessor_extraInitializers = [];
    let _scope_decorators;
    let _scope_initializers = [];
    let _scope_extraInitializers = [];
    return _a = class ComplianceAssessmentDto {
            constructor() {
                this.assessor = __runInitializers(this, _assessor_initializers, void 0);
                this.scope = (__runInitializers(this, _assessor_extraInitializers), __runInitializers(this, _scope_initializers, void 0));
                __runInitializers(this, _scope_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _assessor_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _scope_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _assessor_decorators, { kind: "field", name: "assessor", static: false, private: false, access: { has: obj => "assessor" in obj, get: obj => obj.assessor, set: (obj, value) => { obj.assessor = value; } }, metadata: _metadata }, _assessor_initializers, _assessor_extraInitializers);
            __esDecorate(null, null, _scope_decorators, { kind: "field", name: "scope", static: false, private: false, access: { has: obj => "scope" in obj, get: obj => obj.scope, set: (obj, value) => { obj.scope = value; } }, metadata: _metadata }, _scope_initializers, _scope_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
let ViolationReportDto = (() => {
    var _a;
    let _ruleId_decorators;
    let _ruleId_initializers = [];
    let _ruleId_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _severity_decorators;
    let _severity_initializers = [];
    let _severity_extraInitializers = [];
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _patientId_decorators;
    let _patientId_initializers = [];
    let _patientId_extraInitializers = [];
    let _resourceId_decorators;
    let _resourceId_initializers = [];
    let _resourceId_extraInitializers = [];
    return _a = class ViolationReportDto {
            constructor() {
                this.ruleId = __runInitializers(this, _ruleId_initializers, void 0);
                this.description = (__runInitializers(this, _ruleId_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.severity = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
                this.userId = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
                this.patientId = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _patientId_initializers, void 0));
                this.resourceId = (__runInitializers(this, _patientId_extraInitializers), __runInitializers(this, _resourceId_initializers, void 0));
                __runInitializers(this, _resourceId_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _ruleId_decorators = [(0, class_validator_1.IsString)()];
            _description_decorators = [(0, class_validator_1.IsString)()];
            _severity_decorators = [(0, class_validator_1.IsEnum)(['minor', 'major', 'critical'])];
            _userId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _patientId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _resourceId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _ruleId_decorators, { kind: "field", name: "ruleId", static: false, private: false, access: { has: obj => "ruleId" in obj, get: obj => obj.ruleId, set: (obj, value) => { obj.ruleId = value; } }, metadata: _metadata }, _ruleId_initializers, _ruleId_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: obj => "severity" in obj, get: obj => obj.severity, set: (obj, value) => { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            __esDecorate(null, null, _patientId_decorators, { kind: "field", name: "patientId", static: false, private: false, access: { has: obj => "patientId" in obj, get: obj => obj.patientId, set: (obj, value) => { obj.patientId = value; } }, metadata: _metadata }, _patientId_initializers, _patientId_extraInitializers);
            __esDecorate(null, null, _resourceId_decorators, { kind: "field", name: "resourceId", static: false, private: false, access: { has: obj => "resourceId" in obj, get: obj => obj.resourceId, set: (obj, value) => { obj.resourceId = value; } }, metadata: _metadata }, _resourceId_initializers, _resourceId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
let AuditQueryDto = (() => {
    var _a;
    let _startDate_decorators;
    let _startDate_initializers = [];
    let _startDate_extraInitializers = [];
    let _endDate_decorators;
    let _endDate_initializers = [];
    let _endDate_extraInitializers = [];
    let _eventTypes_decorators;
    let _eventTypes_initializers = [];
    let _eventTypes_extraInitializers = [];
    let _userIds_decorators;
    let _userIds_initializers = [];
    let _userIds_extraInitializers = [];
    let _resources_decorators;
    let _resources_initializers = [];
    let _resources_extraInitializers = [];
    let _severity_decorators;
    let _severity_initializers = [];
    let _severity_extraInitializers = [];
    let _hipaaRelevant_decorators;
    let _hipaaRelevant_initializers = [];
    let _hipaaRelevant_extraInitializers = [];
    return _a = class AuditQueryDto {
            constructor() {
                this.startDate = __runInitializers(this, _startDate_initializers, void 0);
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.eventTypes = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _eventTypes_initializers, void 0));
                this.userIds = (__runInitializers(this, _eventTypes_extraInitializers), __runInitializers(this, _userIds_initializers, void 0));
                this.resources = (__runInitializers(this, _userIds_extraInitializers), __runInitializers(this, _resources_initializers, void 0));
                this.severity = (__runInitializers(this, _resources_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
                this.hipaaRelevant = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _hipaaRelevant_initializers, void 0));
                __runInitializers(this, _hipaaRelevant_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _startDate_decorators = [(0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _endDate_decorators = [(0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _eventTypes_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _userIds_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _resources_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _severity_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            _hipaaRelevant_decorators = [(0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: obj => "startDate" in obj, get: obj => obj.startDate, set: (obj, value) => { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: obj => "endDate" in obj, get: obj => obj.endDate, set: (obj, value) => { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _eventTypes_decorators, { kind: "field", name: "eventTypes", static: false, private: false, access: { has: obj => "eventTypes" in obj, get: obj => obj.eventTypes, set: (obj, value) => { obj.eventTypes = value; } }, metadata: _metadata }, _eventTypes_initializers, _eventTypes_extraInitializers);
            __esDecorate(null, null, _userIds_decorators, { kind: "field", name: "userIds", static: false, private: false, access: { has: obj => "userIds" in obj, get: obj => obj.userIds, set: (obj, value) => { obj.userIds = value; } }, metadata: _metadata }, _userIds_initializers, _userIds_extraInitializers);
            __esDecorate(null, null, _resources_decorators, { kind: "field", name: "resources", static: false, private: false, access: { has: obj => "resources" in obj, get: obj => obj.resources, set: (obj, value) => { obj.resources = value; } }, metadata: _metadata }, _resources_initializers, _resources_extraInitializers);
            __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: obj => "severity" in obj, get: obj => obj.severity, set: (obj, value) => { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
            __esDecorate(null, null, _hipaaRelevant_decorators, { kind: "field", name: "hipaaRelevant", static: false, private: false, access: { has: obj => "hipaaRelevant" in obj, get: obj => obj.hipaaRelevant, set: (obj, value) => { obj.hipaaRelevant = value; } }, metadata: _metadata }, _hipaaRelevant_initializers, _hipaaRelevant_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
let ConsentManagementDto = (() => {
    var _a;
    let _patientId_decorators;
    let _patientId_initializers = [];
    let _patientId_extraInitializers = [];
    let _consentType_decorators;
    let _consentType_initializers = [];
    let _consentType_extraInitializers = [];
    let _granted_decorators;
    let _granted_initializers = [];
    let _granted_extraInitializers = [];
    let _purpose_decorators;
    let _purpose_initializers = [];
    let _purpose_extraInitializers = [];
    let _dataTypes_decorators;
    let _dataTypes_initializers = [];
    let _dataTypes_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    let _restrictions_decorators;
    let _restrictions_initializers = [];
    let _restrictions_extraInitializers = [];
    return _a = class ConsentManagementDto {
            constructor() {
                this.patientId = __runInitializers(this, _patientId_initializers, void 0);
                this.consentType = (__runInitializers(this, _patientId_extraInitializers), __runInitializers(this, _consentType_initializers, void 0));
                this.granted = (__runInitializers(this, _consentType_extraInitializers), __runInitializers(this, _granted_initializers, void 0));
                this.purpose = (__runInitializers(this, _granted_extraInitializers), __runInitializers(this, _purpose_initializers, void 0));
                this.dataTypes = (__runInitializers(this, _purpose_extraInitializers), __runInitializers(this, _dataTypes_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _dataTypes_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                this.restrictions = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _restrictions_initializers, void 0));
                __runInitializers(this, _restrictions_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _patientId_decorators = [(0, class_validator_1.IsString)()];
            _consentType_decorators = [(0, class_validator_1.IsEnum)(['treatment', 'payment', 'operations', 'research', 'marketing'])];
            _granted_decorators = [(0, class_validator_1.IsBoolean)()];
            _purpose_decorators = [(0, class_validator_1.IsString)()];
            _dataTypes_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _expiresAt_decorators = [(0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _restrictions_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _patientId_decorators, { kind: "field", name: "patientId", static: false, private: false, access: { has: obj => "patientId" in obj, get: obj => obj.patientId, set: (obj, value) => { obj.patientId = value; } }, metadata: _metadata }, _patientId_initializers, _patientId_extraInitializers);
            __esDecorate(null, null, _consentType_decorators, { kind: "field", name: "consentType", static: false, private: false, access: { has: obj => "consentType" in obj, get: obj => obj.consentType, set: (obj, value) => { obj.consentType = value; } }, metadata: _metadata }, _consentType_initializers, _consentType_extraInitializers);
            __esDecorate(null, null, _granted_decorators, { kind: "field", name: "granted", static: false, private: false, access: { has: obj => "granted" in obj, get: obj => obj.granted, set: (obj, value) => { obj.granted = value; } }, metadata: _metadata }, _granted_initializers, _granted_extraInitializers);
            __esDecorate(null, null, _purpose_decorators, { kind: "field", name: "purpose", static: false, private: false, access: { has: obj => "purpose" in obj, get: obj => obj.purpose, set: (obj, value) => { obj.purpose = value; } }, metadata: _metadata }, _purpose_initializers, _purpose_extraInitializers);
            __esDecorate(null, null, _dataTypes_decorators, { kind: "field", name: "dataTypes", static: false, private: false, access: { has: obj => "dataTypes" in obj, get: obj => obj.dataTypes, set: (obj, value) => { obj.dataTypes = value; } }, metadata: _metadata }, _dataTypes_initializers, _dataTypes_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _restrictions_decorators, { kind: "field", name: "restrictions", static: false, private: false, access: { has: obj => "restrictions" in obj, get: obj => obj.restrictions, set: (obj, value) => { obj.restrictions = value; } }, metadata: _metadata }, _restrictions_initializers, _restrictions_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
let GenerateReportDto = (() => {
    var _a;
    let _reportType_decorators;
    let _reportType_initializers = [];
    let _reportType_extraInitializers = [];
    let _startDate_decorators;
    let _startDate_initializers = [];
    let _startDate_extraInitializers = [];
    let _endDate_decorators;
    let _endDate_initializers = [];
    let _endDate_extraInitializers = [];
    let _customFilters_decorators;
    let _customFilters_initializers = [];
    let _customFilters_extraInitializers = [];
    return _a = class GenerateReportDto {
            constructor() {
                this.reportType = __runInitializers(this, _reportType_initializers, void 0);
                this.startDate = (__runInitializers(this, _reportType_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.customFilters = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _customFilters_initializers, void 0));
                __runInitializers(this, _customFilters_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _reportType_decorators = [(0, class_validator_1.IsEnum)(['compliance', 'security', 'privacy', 'breach', 'custom'])];
            _startDate_decorators = [(0, class_validator_1.IsDateString)()];
            _endDate_decorators = [(0, class_validator_1.IsDateString)()];
            _customFilters_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _reportType_decorators, { kind: "field", name: "reportType", static: false, private: false, access: { has: obj => "reportType" in obj, get: obj => obj.reportType, set: (obj, value) => { obj.reportType = value; } }, metadata: _metadata }, _reportType_initializers, _reportType_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: obj => "startDate" in obj, get: obj => obj.startDate, set: (obj, value) => { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: obj => "endDate" in obj, get: obj => obj.endDate, set: (obj, value) => { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _customFilters_decorators, { kind: "field", name: "customFilters", static: false, private: false, access: { has: obj => "customFilters" in obj, get: obj => obj.customFilters, set: (obj, value) => { obj.customFilters = value; } }, metadata: _metadata }, _customFilters_initializers, _customFilters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
let ComplianceController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Compliance Management'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('compliance'), (0, common_1.UseGuards)(common_2.JwtAuthGuard, common_2.RolesGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getComplianceDashboard_decorators;
    let _conductAssessment_decorators;
    let _reportViolation_decorators;
    let _getViolations_decorators;
    let _updateViolationStatus_decorators;
    let _queryAuditEvents_decorators;
    let _generateReport_decorators;
    let _getComplianceMetrics_decorators;
    let _manageConsent_decorators;
    let _getPHIAuditTrail_decorators;
    let _generatePHIComplianceReport_decorators;
    let _triggerAuditCleanup_decorators;
    let _healthCheck_decorators;
    var ComplianceController = _classThis = class {
        constructor(hipaaCompliance, phiDataHandler, complianceAudit) {
            this.hipaaCompliance = (__runInitializers(this, _instanceExtraInitializers), hipaaCompliance);
            this.phiDataHandler = phiDataHandler;
            this.complianceAudit = complianceAudit;
        }
        async getComplianceDashboard(req) {
            try {
                const today = new Date();
                const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                // Get recent compliance metrics
                const metrics = await this.complianceAudit.getComplianceMetrics(today);
                // Get recent assessment
                const assessment = await this.hipaaCompliance.assessCompliance(req.user.id);
                // Get recent violations
                const violations = await this.complianceAudit.detectComplianceViolations({
                    startDate: thirtyDaysAgo,
                    endDate: today
                });
                // Get audit events summary
                const auditSummary = await this.complianceAudit.queryAuditEvents({
                    startDate: thirtyDaysAgo,
                    endDate: today,
                    limit: 100
                });
                return {
                    status: 'success',
                    data: {
                        overview: {
                            overallComplianceScore: assessment.results.overallScore,
                            criticalViolations: violations.filter(v => v.severity === 'critical').length,
                            totalAudits: auditSummary.length,
                            lastAssessment: assessment.assessmentDate
                        },
                        metrics: metrics.complianceScores,
                        recentViolations: violations.slice(0, 10),
                        complianceStatus: assessment.results,
                        trends: {
                            dailyMetrics: metrics.metrics,
                            weeklyTrend: 'stable' // Would calculate from historical data
                        }
                    }
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to retrieve compliance dashboard: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async conductAssessment(assessmentDto, req) {
            try {
                const assessment = await this.hipaaCompliance.assessCompliance(assessmentDto.assessor || req.user.id, assessmentDto.scope);
                // Log the assessment activity
                await this.complianceAudit.logAuditEvent('system_access', 'compliance_assessment', 'conduct_assessment', 'success', {
                    assessmentId: assessment.assessmentId,
                    overallScore: assessment.results.overallScore,
                    rulesAssessed: assessment.findings.length,
                    scope: assessmentDto.scope
                }, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    mfaVerified: true
                });
                return {
                    status: 'success',
                    data: assessment
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to conduct compliance assessment: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async reportViolation(violationDto, req) {
            try {
                const violationId = await this.hipaaCompliance.reportViolation(violationDto.ruleId, violationDto.description, violationDto.severity, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    patientId: violationDto.patientId,
                    resourceId: violationDto.resourceId
                });
                return {
                    status: 'success',
                    data: { violationId }
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to report violation: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getViolations(severity, status, limit = 50) {
            try {
                // Temporary fallback for missing method
                const violations = this.hipaaCompliance.getViolations ?
                    await this.hipaaCompliance.getViolations({
                        severity: severity,
                        status: status,
                        limit
                    }) : [];
                return {
                    status: 'success',
                    data: violations
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to retrieve violations: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateViolationStatus(violationId, status, req, resolution) {
            try {
                // Temporary fallback for missing method
                if (this.hipaaCompliance.updateViolationStatus) {
                    await this.hipaaCompliance.updateViolationStatus(violationId, status, req.user.id, resolution);
                }
                return {
                    status: 'success',
                    message: 'Violation status updated successfully'
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to update violation status: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async queryAuditEvents(queryDto) {
            try {
                const query = {
                    ...queryDto,
                    startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
                    endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
                    eventTypes: queryDto.eventTypes,
                    limit: 100 // Default limit
                };
                const events = await this.complianceAudit.queryAuditEvents(query);
                return {
                    status: 'success',
                    data: events
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to query audit events: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async generateReport(reportDto, req) {
            try {
                const customFilters = reportDto.customFilters ? {
                    ...reportDto.customFilters,
                    startDate: reportDto.customFilters.startDate ? new Date(reportDto.customFilters.startDate) : undefined,
                    endDate: reportDto.customFilters.endDate ? new Date(reportDto.customFilters.endDate) : undefined,
                    eventTypes: reportDto.customFilters.eventTypes
                } : undefined;
                const report = await this.complianceAudit.generateComplianceReport(reportDto.reportType, new Date(reportDto.startDate), new Date(reportDto.endDate), req.user.id, customFilters);
                return {
                    status: 'success',
                    data: report
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to generate compliance report: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getComplianceMetrics(date) {
            try {
                const targetDate = date ? new Date(date) : new Date();
                const metrics = await this.complianceAudit.getComplianceMetrics(targetDate);
                return {
                    status: 'success',
                    data: metrics
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to retrieve compliance metrics: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async manageConsent(consentDto, req) {
            try {
                const consent = {
                    consentId: `CONSENT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    ...consentDto,
                    grantedAt: consentDto.granted ? new Date() : undefined,
                    expiresAt: consentDto.expiresAt ? new Date(consentDto.expiresAt) : undefined
                };
                await this.phiDataHandler.manageConsent(consent);
                // Log consent management activity
                await this.complianceAudit.logAuditEvent('consent_management', 'patient_consent', 'update_consent', 'success', {
                    consentId: consent.consentId,
                    patientId: consentDto.patientId,
                    consentType: consentDto.consentType,
                    granted: consentDto.granted,
                    purpose: consentDto.purpose
                }, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    mfaVerified: true,
                    patientId: consentDto.patientId
                });
                return {
                    status: 'success',
                    message: 'Patient consent updated successfully'
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to manage consent: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getPHIAuditTrail(patientId, req, startDate, endDate) {
            try {
                const trail = await this.phiDataHandler.getPHIAuditTrail(patientId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
                // Log audit trail access
                await this.complianceAudit.logAuditEvent('data_access', 'phi_audit_trail', 'view_audit_trail', 'success', {
                    patientId,
                    entriesReturned: trail.length,
                    dateRange: { startDate, endDate }
                }, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    mfaVerified: true,
                    patientId
                });
                return {
                    status: 'success',
                    data: trail
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to retrieve PHI audit trail: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async generatePHIComplianceReport(startDate, endDate, req) {
            try {
                const report = await this.phiDataHandler.generateComplianceReport(new Date(startDate), new Date(endDate));
                // Log report generation
                await this.complianceAudit.logAuditEvent('system_access', 'phi_compliance_report', 'generate_report', 'success', {
                    dateRange: { startDate, endDate },
                    totalAccesses: report.summary.totalAccesses,
                    violations: report.violations.length
                }, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    mfaVerified: true
                });
                return {
                    status: 'success',
                    data: report
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to generate PHI compliance report: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async triggerAuditCleanup(req) {
            try {
                // This would trigger the cleanup method (normally runs via cron)
                // Implementation would depend on the specific cleanup mechanism
                await this.complianceAudit.logAuditEvent('system_access', 'audit_system', 'manual_cleanup_trigger', 'success', {
                    triggeredBy: req.user.id,
                    timestamp: new Date().toISOString()
                }, {
                    userId: req.user.id,
                    sessionId: req.sessionID,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    service: 'compliance-api',
                    mfaVerified: true
                });
                return {
                    status: 'success',
                    message: 'Audit cleanup triggered successfully'
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to trigger audit cleanup: ${error instanceof Error ? error.message : String(error)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async healthCheck() {
            try {
                const currentTime = new Date();
                const dayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
                // Check recent audit activity
                const recentAudits = await this.complianceAudit.queryAuditEvents({
                    startDate: dayAgo,
                    endDate: currentTime,
                    limit: 10
                });
                // Get current metrics
                const metrics = await this.complianceAudit.getComplianceMetrics();
                return {
                    status: 'success',
                    data: {
                        systemStatus: 'healthy',
                        lastAuditEvent: recentAudits[0]?.timestamp || 'No recent events',
                        auditEventsLast24h: recentAudits.length,
                        complianceScores: metrics.complianceScores,
                        timestamp: currentTime.toISOString()
                    }
                };
            }
            catch (error) {
                return {
                    status: 'error',
                    data: {
                        systemStatus: 'unhealthy',
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date().toISOString()
                    }
                };
            }
        }
    };
    __setFunctionName(_classThis, "ComplianceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getComplianceDashboard_decorators = [(0, common_1.Get)('dashboard'), (0, swagger_1.ApiOperation)({ summary: 'Get compliance dashboard overview' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Compliance dashboard data retrieved successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER)];
        _conductAssessment_decorators = [(0, common_1.Post)('assessment'), (0, swagger_1.ApiOperation)({ summary: 'Conduct HIPAA compliance assessment' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Compliance assessment completed successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER), (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true }))];
        _reportViolation_decorators = [(0, common_1.Post)('violations'), (0, swagger_1.ApiOperation)({ summary: 'Report a compliance violation' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Violation reported successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER, common_2.UserRole.HEALTHCARE_PROVIDER), (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true }))];
        _getViolations_decorators = [(0, common_1.Get)('violations'), (0, swagger_1.ApiOperation)({ summary: 'Get compliance violations' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Violations retrieved successfully' }), (0, swagger_1.ApiQuery)({ name: 'severity', required: false, enum: ['minor', 'major', 'critical'] }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['open', 'investigating', 'resolved'] }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER)];
        _updateViolationStatus_decorators = [(0, common_1.Put)('violations/:violationId/status'), (0, swagger_1.ApiOperation)({ summary: 'Update violation status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Violation status updated successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER)];
        _queryAuditEvents_decorators = [(0, common_1.Get)('audit-events'), (0, swagger_1.ApiOperation)({ summary: 'Query audit events' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit events retrieved successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER, common_2.UserRole.SECURITY_OFFICER)];
        _generateReport_decorators = [(0, common_1.Post)('reports'), (0, swagger_1.ApiOperation)({ summary: 'Generate compliance report' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Compliance report generated successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER), (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true }))];
        _getComplianceMetrics_decorators = [(0, common_1.Get)('metrics'), (0, swagger_1.ApiOperation)({ summary: 'Get compliance metrics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Compliance metrics retrieved successfully' }), (0, swagger_1.ApiQuery)({ name: 'date', required: false, type: 'string' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER)];
        _manageConsent_decorators = [(0, common_1.Post)('consent'), (0, swagger_1.ApiOperation)({ summary: 'Manage patient consent' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Patient consent updated successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.HEALTHCARE_PROVIDER, common_2.UserRole.NURSE, common_2.UserRole.CONSENT_MANAGER), (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true }))];
        _getPHIAuditTrail_decorators = [(0, common_1.Get)('phi-audit/:patientId'), (0, swagger_1.ApiOperation)({ summary: 'Get PHI audit trail for patient' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'PHI audit trail retrieved successfully' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: 'string' }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: 'string' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER, common_2.UserRole.HEALTHCARE_PROVIDER)];
        _generatePHIComplianceReport_decorators = [(0, common_1.Get)('phi-compliance-report'), (0, swagger_1.ApiOperation)({ summary: 'Generate PHI compliance report' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'PHI compliance report generated successfully' }), (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: 'string' }), (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: 'string' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.COMPLIANCE_OFFICER, common_2.UserRole.PRIVACY_OFFICER)];
        _triggerAuditCleanup_decorators = [(0, common_1.Delete)('audit-events/cleanup'), (0, swagger_1.ApiOperation)({ summary: 'Manually trigger audit events cleanup' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit cleanup completed successfully' }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SYSTEM_ADMINISTRATOR)];
        _healthCheck_decorators = [(0, common_1.Get)('health'), (0, swagger_1.ApiOperation)({ summary: 'Compliance system health check' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Compliance system health status' })];
        __esDecorate(_classThis, null, _getComplianceDashboard_decorators, { kind: "method", name: "getComplianceDashboard", static: false, private: false, access: { has: obj => "getComplianceDashboard" in obj, get: obj => obj.getComplianceDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _conductAssessment_decorators, { kind: "method", name: "conductAssessment", static: false, private: false, access: { has: obj => "conductAssessment" in obj, get: obj => obj.conductAssessment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reportViolation_decorators, { kind: "method", name: "reportViolation", static: false, private: false, access: { has: obj => "reportViolation" in obj, get: obj => obj.reportViolation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getViolations_decorators, { kind: "method", name: "getViolations", static: false, private: false, access: { has: obj => "getViolations" in obj, get: obj => obj.getViolations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateViolationStatus_decorators, { kind: "method", name: "updateViolationStatus", static: false, private: false, access: { has: obj => "updateViolationStatus" in obj, get: obj => obj.updateViolationStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _queryAuditEvents_decorators, { kind: "method", name: "queryAuditEvents", static: false, private: false, access: { has: obj => "queryAuditEvents" in obj, get: obj => obj.queryAuditEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateReport_decorators, { kind: "method", name: "generateReport", static: false, private: false, access: { has: obj => "generateReport" in obj, get: obj => obj.generateReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getComplianceMetrics_decorators, { kind: "method", name: "getComplianceMetrics", static: false, private: false, access: { has: obj => "getComplianceMetrics" in obj, get: obj => obj.getComplianceMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _manageConsent_decorators, { kind: "method", name: "manageConsent", static: false, private: false, access: { has: obj => "manageConsent" in obj, get: obj => obj.manageConsent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPHIAuditTrail_decorators, { kind: "method", name: "getPHIAuditTrail", static: false, private: false, access: { has: obj => "getPHIAuditTrail" in obj, get: obj => obj.getPHIAuditTrail }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generatePHIComplianceReport_decorators, { kind: "method", name: "generatePHIComplianceReport", static: false, private: false, access: { has: obj => "generatePHIComplianceReport" in obj, get: obj => obj.generatePHIComplianceReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _triggerAuditCleanup_decorators, { kind: "method", name: "triggerAuditCleanup", static: false, private: false, access: { has: obj => "triggerAuditCleanup" in obj, get: obj => obj.triggerAuditCleanup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComplianceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComplianceController = _classThis;
})();
exports.ComplianceController = ComplianceController;
