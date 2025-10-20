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
exports.AuditEvent = void 0;
const typeorm_1 = require("typeorm");
const audit_enums_1 = require("../enums/audit.enums");
let AuditEvent = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('audit_events'), (0, typeorm_1.Index)(['timestamp', 'userId']), (0, typeorm_1.Index)(['timestamp', 'patientId']), (0, typeorm_1.Index)(['category', 'severity']), (0, typeorm_1.Index)(['eventType', 'timestamp']), (0, typeorm_1.Index)(['ipAddress', 'timestamp'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _eventType_decorators;
    let _eventType_initializers = [];
    let _eventType_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _severity_decorators;
    let _severity_initializers = [];
    let _severity_extraInitializers = [];
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _userRole_decorators;
    let _userRole_initializers = [];
    let _userRole_extraInitializers = [];
    let _patientId_decorators;
    let _patientId_initializers = [];
    let _patientId_extraInitializers = [];
    let _targetUserId_decorators;
    let _targetUserId_initializers = [];
    let _targetUserId_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _ipAddress_decorators;
    let _ipAddress_initializers = [];
    let _ipAddress_extraInitializers = [];
    let _userAgent_decorators;
    let _userAgent_initializers = [];
    let _userAgent_extraInitializers = [];
    let _sessionId_decorators;
    let _sessionId_initializers = [];
    let _sessionId_extraInitializers = [];
    let _resourceType_decorators;
    let _resourceType_initializers = [];
    let _resourceType_extraInitializers = [];
    let _resourceId_decorators;
    let _resourceId_initializers = [];
    let _resourceId_extraInitializers = [];
    let _endpoint_decorators;
    let _endpoint_initializers = [];
    let _endpoint_extraInitializers = [];
    let _httpMethod_decorators;
    let _httpMethod_initializers = [];
    let _httpMethod_extraInitializers = [];
    let _responseStatus_decorators;
    let _responseStatus_initializers = [];
    let _responseStatus_extraInitializers = [];
    let _responseTime_decorators;
    let _responseTime_initializers = [];
    let _responseTime_extraInitializers = [];
    let _additionalData_decorators;
    let _additionalData_initializers = [];
    let _additionalData_extraInitializers = [];
    let _geolocation_decorators;
    let _geolocation_initializers = [];
    let _geolocation_extraInitializers = [];
    let _deviceType_decorators;
    let _deviceType_initializers = [];
    let _deviceType_extraInitializers = [];
    let _clientApplication_decorators;
    let _clientApplication_initializers = [];
    let _clientApplication_extraInitializers = [];
    let _requiresAlert_decorators;
    let _requiresAlert_initializers = [];
    let _requiresAlert_extraInitializers = [];
    let _reviewed_decorators;
    let _reviewed_initializers = [];
    let _reviewed_extraInitializers = [];
    let _reviewedBy_decorators;
    let _reviewedBy_initializers = [];
    let _reviewedBy_extraInitializers = [];
    let _reviewedAt_decorators;
    let _reviewedAt_initializers = [];
    let _reviewedAt_extraInitializers = [];
    let _reviewNotes_decorators;
    let _reviewNotes_initializers = [];
    let _reviewNotes_extraInitializers = [];
    let _complianceFramework_decorators;
    let _complianceFramework_initializers = [];
    let _complianceFramework_extraInitializers = [];
    let _riskLevel_decorators;
    let _riskLevel_initializers = [];
    let _riskLevel_extraInitializers = [];
    let _dataExported_decorators;
    let _dataExported_initializers = [];
    let _dataExported_extraInitializers = [];
    let _recordsAffected_decorators;
    let _recordsAffected_initializers = [];
    let _recordsAffected_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _sourceSystem_decorators;
    let _sourceSystem_initializers = [];
    let _sourceSystem_extraInitializers = [];
    let _schemaVersion_decorators;
    let _schemaVersion_initializers = [];
    let _schemaVersion_extraInitializers = [];
    let _dataHash_decorators;
    let _dataHash_initializers = [];
    let _dataHash_extraInitializers = [];
    let _suspiciousActivity_decorators;
    let _suspiciousActivity_initializers = [];
    let _suspiciousActivity_extraInitializers = [];
    let _correlationId_decorators;
    let _correlationId_initializers = [];
    let _correlationId_extraInitializers = [];
    let _hipaaMetadata_decorators;
    let _hipaaMetadata_initializers = [];
    let _hipaaMetadata_extraInitializers = [];
    let _includeInComplianceReport_decorators;
    let _includeInComplianceReport_initializers = [];
    let _includeInComplianceReport_extraInitializers = [];
    var AuditEvent = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.eventType = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _eventType_initializers, void 0));
            this.category = (__runInitializers(this, _eventType_extraInitializers), __runInitializers(this, _category_initializers, void 0));
            this.severity = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
            this.userId = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.userRole = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _userRole_initializers, void 0));
            this.patientId = (__runInitializers(this, _userRole_extraInitializers), __runInitializers(this, _patientId_initializers, void 0));
            this.targetUserId = (__runInitializers(this, _patientId_extraInitializers), __runInitializers(this, _targetUserId_initializers, void 0));
            this.description = (__runInitializers(this, _targetUserId_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.ipAddress = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _ipAddress_initializers, void 0));
            this.userAgent = (__runInitializers(this, _ipAddress_extraInitializers), __runInitializers(this, _userAgent_initializers, void 0));
            this.sessionId = (__runInitializers(this, _userAgent_extraInitializers), __runInitializers(this, _sessionId_initializers, void 0));
            this.resourceType = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _resourceType_initializers, void 0));
            this.resourceId = (__runInitializers(this, _resourceType_extraInitializers), __runInitializers(this, _resourceId_initializers, void 0));
            this.endpoint = (__runInitializers(this, _resourceId_extraInitializers), __runInitializers(this, _endpoint_initializers, void 0));
            this.httpMethod = (__runInitializers(this, _endpoint_extraInitializers), __runInitializers(this, _httpMethod_initializers, void 0));
            this.responseStatus = (__runInitializers(this, _httpMethod_extraInitializers), __runInitializers(this, _responseStatus_initializers, void 0));
            this.responseTime = (__runInitializers(this, _responseStatus_extraInitializers), __runInitializers(this, _responseTime_initializers, void 0));
            this.additionalData = (__runInitializers(this, _responseTime_extraInitializers), __runInitializers(this, _additionalData_initializers, void 0));
            this.geolocation = (__runInitializers(this, _additionalData_extraInitializers), __runInitializers(this, _geolocation_initializers, void 0));
            this.deviceType = (__runInitializers(this, _geolocation_extraInitializers), __runInitializers(this, _deviceType_initializers, void 0));
            this.clientApplication = (__runInitializers(this, _deviceType_extraInitializers), __runInitializers(this, _clientApplication_initializers, void 0));
            this.requiresAlert = (__runInitializers(this, _clientApplication_extraInitializers), __runInitializers(this, _requiresAlert_initializers, void 0));
            this.reviewed = (__runInitializers(this, _requiresAlert_extraInitializers), __runInitializers(this, _reviewed_initializers, void 0));
            this.reviewedBy = (__runInitializers(this, _reviewed_extraInitializers), __runInitializers(this, _reviewedBy_initializers, void 0));
            this.reviewedAt = (__runInitializers(this, _reviewedBy_extraInitializers), __runInitializers(this, _reviewedAt_initializers, void 0));
            this.reviewNotes = (__runInitializers(this, _reviewedAt_extraInitializers), __runInitializers(this, _reviewNotes_initializers, void 0));
            this.complianceFramework = (__runInitializers(this, _reviewNotes_extraInitializers), __runInitializers(this, _complianceFramework_initializers, void 0));
            this.riskLevel = (__runInitializers(this, _complianceFramework_extraInitializers), __runInitializers(this, _riskLevel_initializers, void 0));
            this.dataExported = (__runInitializers(this, _riskLevel_extraInitializers), __runInitializers(this, _dataExported_initializers, void 0));
            this.recordsAffected = (__runInitializers(this, _dataExported_extraInitializers), __runInitializers(this, _recordsAffected_initializers, void 0));
            this.timestamp = (__runInitializers(this, _recordsAffected_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            this.createdAt = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.sourceSystem = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _sourceSystem_initializers, void 0));
            this.schemaVersion = (__runInitializers(this, _sourceSystem_extraInitializers), __runInitializers(this, _schemaVersion_initializers, void 0));
            this.dataHash = (__runInitializers(this, _schemaVersion_extraInitializers), __runInitializers(this, _dataHash_initializers, void 0));
            this.suspiciousActivity = (__runInitializers(this, _dataHash_extraInitializers), __runInitializers(this, _suspiciousActivity_initializers, void 0));
            this.correlationId = (__runInitializers(this, _suspiciousActivity_extraInitializers), __runInitializers(this, _correlationId_initializers, void 0));
            this.hipaaMetadata = (__runInitializers(this, _correlationId_extraInitializers), __runInitializers(this, _hipaaMetadata_initializers, void 0));
            this.includeInComplianceReport = (__runInitializers(this, _hipaaMetadata_extraInitializers), __runInitializers(this, _includeInComplianceReport_initializers, void 0));
            __runInitializers(this, _includeInComplianceReport_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "AuditEvent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 50 })];
        _eventType_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: audit_enums_1.AuditEventType,
                comment: 'Type of audit event that occurred',
            })];
        _category_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: audit_enums_1.AuditCategory,
                comment: 'Category classification of the audit event',
            })];
        _severity_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: audit_enums_1.AuditSeverity,
                comment: 'Severity level of the audit event',
            })];
        _userId_decorators = [(0, typeorm_1.Column)({
                type: 'uuid',
                nullable: true,
                comment: 'ID of the user who performed the action',
            }), (0, typeorm_1.Index)()];
        _userRole_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                nullable: true,
                comment: 'Role of the user who performed the action',
            })];
        _patientId_decorators = [(0, typeorm_1.Column)({
                type: 'uuid',
                nullable: true,
                comment: 'ID of the patient whose data was accessed (HIPAA)',
            }), (0, typeorm_1.Index)()];
        _targetUserId_decorators = [(0, typeorm_1.Column)({
                type: 'uuid',
                nullable: true,
                comment: 'ID of the target user (for admin actions)',
            })];
        _description_decorators = [(0, typeorm_1.Column)({
                type: 'text',
                comment: 'Human-readable description of the event',
            })];
        _ipAddress_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 45,
                nullable: true,
                comment: 'IP address from which the action was performed',
            }), (0, typeorm_1.Index)()];
        _userAgent_decorators = [(0, typeorm_1.Column)({
                type: 'text',
                nullable: true,
                comment: 'User agent string from the client',
            })];
        _sessionId_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Session ID associated with the action',
            })];
        _resourceType_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Type of resource that was accessed or modified',
            })];
        _resourceId_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'ID of the specific resource that was accessed',
            })];
        _endpoint_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 255,
                nullable: true,
                comment: 'API endpoint that was called',
            })];
        _httpMethod_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 10,
                nullable: true,
                comment: 'HTTP method used (GET, POST, PUT, DELETE)',
            })];
        _responseStatus_decorators = [(0, typeorm_1.Column)({
                type: 'int',
                nullable: true,
                comment: 'HTTP response status code',
            })];
        _responseTime_decorators = [(0, typeorm_1.Column)({
                type: 'int',
                nullable: true,
                comment: 'Response time in milliseconds',
            })];
        _additionalData_decorators = [(0, typeorm_1.Column)({
                type: 'json',
                nullable: true,
                comment: 'Additional structured data related to the event',
            })];
        _geolocation_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 255,
                nullable: true,
                comment: 'Geographic location derived from IP address',
            })];
        _deviceType_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Device type (mobile, desktop, tablet)',
            })];
        _clientApplication_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Browser or application name',
            })];
        _requiresAlert_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether this event requires immediate attention',
            })];
        _reviewed_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether this event has been reviewed by an administrator',
            })];
        _reviewedBy_decorators = [(0, typeorm_1.Column)({
                type: 'uuid',
                nullable: true,
                comment: 'ID of the administrator who reviewed this event',
            })];
        _reviewedAt_decorators = [(0, typeorm_1.Column)({
                type: 'timestamp',
                nullable: true,
                comment: 'When this event was reviewed',
            })];
        _reviewNotes_decorators = [(0, typeorm_1.Column)({
                type: 'text',
                nullable: true,
                comment: 'Notes from the administrator review',
            })];
        _complianceFramework_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Compliance framework this event relates to (HIPAA, SOX, etc.)',
            })];
        _riskLevel_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                nullable: true,
                comment: 'Risk level assessment (LOW, MEDIUM, HIGH, CRITICAL)',
            })];
        _dataExported_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether data was exported or downloaded',
            })];
        _recordsAffected_decorators = [(0, typeorm_1.Column)({
                type: 'int',
                nullable: true,
                comment: 'Number of records affected by this action',
            })];
        _timestamp_decorators = [(0, typeorm_1.CreateDateColumn)({
                type: 'timestamp',
                comment: 'When the audit event occurred',
            }), (0, typeorm_1.Index)()];
        _createdAt_decorators = [(0, typeorm_1.Column)({
                type: 'timestamp',
                default: () => 'CURRENT_TIMESTAMP',
                comment: 'When this audit record was created',
            }), (0, typeorm_1.Index)()];
        _sourceSystem_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'Source system or service that generated this event',
            })];
        _schemaVersion_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                nullable: true,
                comment: 'Version of the audit schema used',
            })];
        _dataHash_decorators = [(0, typeorm_1.Column)({
                type: 'text',
                nullable: true,
                comment: 'Hash of sensitive data for integrity verification',
            })];
        _suspiciousActivity_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether this event is part of a suspicious pattern',
            })];
        _correlationId_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 100,
                nullable: true,
                comment: 'ID linking related events together',
            })];
        _hipaaMetadata_decorators = [(0, typeorm_1.Column)({
                type: 'json',
                nullable: true,
                comment: 'HIPAA-specific metadata for compliance reporting',
            })];
        _includeInComplianceReport_decorators = [(0, typeorm_1.Column)({
                type: 'boolean',
                default: false,
                comment: 'Whether this event should be included in compliance reports',
            })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _eventType_decorators, { kind: "field", name: "eventType", static: false, private: false, access: { has: obj => "eventType" in obj, get: obj => obj.eventType, set: (obj, value) => { obj.eventType = value; } }, metadata: _metadata }, _eventType_initializers, _eventType_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: obj => "severity" in obj, get: obj => obj.severity, set: (obj, value) => { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _userRole_decorators, { kind: "field", name: "userRole", static: false, private: false, access: { has: obj => "userRole" in obj, get: obj => obj.userRole, set: (obj, value) => { obj.userRole = value; } }, metadata: _metadata }, _userRole_initializers, _userRole_extraInitializers);
        __esDecorate(null, null, _patientId_decorators, { kind: "field", name: "patientId", static: false, private: false, access: { has: obj => "patientId" in obj, get: obj => obj.patientId, set: (obj, value) => { obj.patientId = value; } }, metadata: _metadata }, _patientId_initializers, _patientId_extraInitializers);
        __esDecorate(null, null, _targetUserId_decorators, { kind: "field", name: "targetUserId", static: false, private: false, access: { has: obj => "targetUserId" in obj, get: obj => obj.targetUserId, set: (obj, value) => { obj.targetUserId = value; } }, metadata: _metadata }, _targetUserId_initializers, _targetUserId_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _ipAddress_decorators, { kind: "field", name: "ipAddress", static: false, private: false, access: { has: obj => "ipAddress" in obj, get: obj => obj.ipAddress, set: (obj, value) => { obj.ipAddress = value; } }, metadata: _metadata }, _ipAddress_initializers, _ipAddress_extraInitializers);
        __esDecorate(null, null, _userAgent_decorators, { kind: "field", name: "userAgent", static: false, private: false, access: { has: obj => "userAgent" in obj, get: obj => obj.userAgent, set: (obj, value) => { obj.userAgent = value; } }, metadata: _metadata }, _userAgent_initializers, _userAgent_extraInitializers);
        __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: obj => "sessionId" in obj, get: obj => obj.sessionId, set: (obj, value) => { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
        __esDecorate(null, null, _resourceType_decorators, { kind: "field", name: "resourceType", static: false, private: false, access: { has: obj => "resourceType" in obj, get: obj => obj.resourceType, set: (obj, value) => { obj.resourceType = value; } }, metadata: _metadata }, _resourceType_initializers, _resourceType_extraInitializers);
        __esDecorate(null, null, _resourceId_decorators, { kind: "field", name: "resourceId", static: false, private: false, access: { has: obj => "resourceId" in obj, get: obj => obj.resourceId, set: (obj, value) => { obj.resourceId = value; } }, metadata: _metadata }, _resourceId_initializers, _resourceId_extraInitializers);
        __esDecorate(null, null, _endpoint_decorators, { kind: "field", name: "endpoint", static: false, private: false, access: { has: obj => "endpoint" in obj, get: obj => obj.endpoint, set: (obj, value) => { obj.endpoint = value; } }, metadata: _metadata }, _endpoint_initializers, _endpoint_extraInitializers);
        __esDecorate(null, null, _httpMethod_decorators, { kind: "field", name: "httpMethod", static: false, private: false, access: { has: obj => "httpMethod" in obj, get: obj => obj.httpMethod, set: (obj, value) => { obj.httpMethod = value; } }, metadata: _metadata }, _httpMethod_initializers, _httpMethod_extraInitializers);
        __esDecorate(null, null, _responseStatus_decorators, { kind: "field", name: "responseStatus", static: false, private: false, access: { has: obj => "responseStatus" in obj, get: obj => obj.responseStatus, set: (obj, value) => { obj.responseStatus = value; } }, metadata: _metadata }, _responseStatus_initializers, _responseStatus_extraInitializers);
        __esDecorate(null, null, _responseTime_decorators, { kind: "field", name: "responseTime", static: false, private: false, access: { has: obj => "responseTime" in obj, get: obj => obj.responseTime, set: (obj, value) => { obj.responseTime = value; } }, metadata: _metadata }, _responseTime_initializers, _responseTime_extraInitializers);
        __esDecorate(null, null, _additionalData_decorators, { kind: "field", name: "additionalData", static: false, private: false, access: { has: obj => "additionalData" in obj, get: obj => obj.additionalData, set: (obj, value) => { obj.additionalData = value; } }, metadata: _metadata }, _additionalData_initializers, _additionalData_extraInitializers);
        __esDecorate(null, null, _geolocation_decorators, { kind: "field", name: "geolocation", static: false, private: false, access: { has: obj => "geolocation" in obj, get: obj => obj.geolocation, set: (obj, value) => { obj.geolocation = value; } }, metadata: _metadata }, _geolocation_initializers, _geolocation_extraInitializers);
        __esDecorate(null, null, _deviceType_decorators, { kind: "field", name: "deviceType", static: false, private: false, access: { has: obj => "deviceType" in obj, get: obj => obj.deviceType, set: (obj, value) => { obj.deviceType = value; } }, metadata: _metadata }, _deviceType_initializers, _deviceType_extraInitializers);
        __esDecorate(null, null, _clientApplication_decorators, { kind: "field", name: "clientApplication", static: false, private: false, access: { has: obj => "clientApplication" in obj, get: obj => obj.clientApplication, set: (obj, value) => { obj.clientApplication = value; } }, metadata: _metadata }, _clientApplication_initializers, _clientApplication_extraInitializers);
        __esDecorate(null, null, _requiresAlert_decorators, { kind: "field", name: "requiresAlert", static: false, private: false, access: { has: obj => "requiresAlert" in obj, get: obj => obj.requiresAlert, set: (obj, value) => { obj.requiresAlert = value; } }, metadata: _metadata }, _requiresAlert_initializers, _requiresAlert_extraInitializers);
        __esDecorate(null, null, _reviewed_decorators, { kind: "field", name: "reviewed", static: false, private: false, access: { has: obj => "reviewed" in obj, get: obj => obj.reviewed, set: (obj, value) => { obj.reviewed = value; } }, metadata: _metadata }, _reviewed_initializers, _reviewed_extraInitializers);
        __esDecorate(null, null, _reviewedBy_decorators, { kind: "field", name: "reviewedBy", static: false, private: false, access: { has: obj => "reviewedBy" in obj, get: obj => obj.reviewedBy, set: (obj, value) => { obj.reviewedBy = value; } }, metadata: _metadata }, _reviewedBy_initializers, _reviewedBy_extraInitializers);
        __esDecorate(null, null, _reviewedAt_decorators, { kind: "field", name: "reviewedAt", static: false, private: false, access: { has: obj => "reviewedAt" in obj, get: obj => obj.reviewedAt, set: (obj, value) => { obj.reviewedAt = value; } }, metadata: _metadata }, _reviewedAt_initializers, _reviewedAt_extraInitializers);
        __esDecorate(null, null, _reviewNotes_decorators, { kind: "field", name: "reviewNotes", static: false, private: false, access: { has: obj => "reviewNotes" in obj, get: obj => obj.reviewNotes, set: (obj, value) => { obj.reviewNotes = value; } }, metadata: _metadata }, _reviewNotes_initializers, _reviewNotes_extraInitializers);
        __esDecorate(null, null, _complianceFramework_decorators, { kind: "field", name: "complianceFramework", static: false, private: false, access: { has: obj => "complianceFramework" in obj, get: obj => obj.complianceFramework, set: (obj, value) => { obj.complianceFramework = value; } }, metadata: _metadata }, _complianceFramework_initializers, _complianceFramework_extraInitializers);
        __esDecorate(null, null, _riskLevel_decorators, { kind: "field", name: "riskLevel", static: false, private: false, access: { has: obj => "riskLevel" in obj, get: obj => obj.riskLevel, set: (obj, value) => { obj.riskLevel = value; } }, metadata: _metadata }, _riskLevel_initializers, _riskLevel_extraInitializers);
        __esDecorate(null, null, _dataExported_decorators, { kind: "field", name: "dataExported", static: false, private: false, access: { has: obj => "dataExported" in obj, get: obj => obj.dataExported, set: (obj, value) => { obj.dataExported = value; } }, metadata: _metadata }, _dataExported_initializers, _dataExported_extraInitializers);
        __esDecorate(null, null, _recordsAffected_decorators, { kind: "field", name: "recordsAffected", static: false, private: false, access: { has: obj => "recordsAffected" in obj, get: obj => obj.recordsAffected, set: (obj, value) => { obj.recordsAffected = value; } }, metadata: _metadata }, _recordsAffected_initializers, _recordsAffected_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _sourceSystem_decorators, { kind: "field", name: "sourceSystem", static: false, private: false, access: { has: obj => "sourceSystem" in obj, get: obj => obj.sourceSystem, set: (obj, value) => { obj.sourceSystem = value; } }, metadata: _metadata }, _sourceSystem_initializers, _sourceSystem_extraInitializers);
        __esDecorate(null, null, _schemaVersion_decorators, { kind: "field", name: "schemaVersion", static: false, private: false, access: { has: obj => "schemaVersion" in obj, get: obj => obj.schemaVersion, set: (obj, value) => { obj.schemaVersion = value; } }, metadata: _metadata }, _schemaVersion_initializers, _schemaVersion_extraInitializers);
        __esDecorate(null, null, _dataHash_decorators, { kind: "field", name: "dataHash", static: false, private: false, access: { has: obj => "dataHash" in obj, get: obj => obj.dataHash, set: (obj, value) => { obj.dataHash = value; } }, metadata: _metadata }, _dataHash_initializers, _dataHash_extraInitializers);
        __esDecorate(null, null, _suspiciousActivity_decorators, { kind: "field", name: "suspiciousActivity", static: false, private: false, access: { has: obj => "suspiciousActivity" in obj, get: obj => obj.suspiciousActivity, set: (obj, value) => { obj.suspiciousActivity = value; } }, metadata: _metadata }, _suspiciousActivity_initializers, _suspiciousActivity_extraInitializers);
        __esDecorate(null, null, _correlationId_decorators, { kind: "field", name: "correlationId", static: false, private: false, access: { has: obj => "correlationId" in obj, get: obj => obj.correlationId, set: (obj, value) => { obj.correlationId = value; } }, metadata: _metadata }, _correlationId_initializers, _correlationId_extraInitializers);
        __esDecorate(null, null, _hipaaMetadata_decorators, { kind: "field", name: "hipaaMetadata", static: false, private: false, access: { has: obj => "hipaaMetadata" in obj, get: obj => obj.hipaaMetadata, set: (obj, value) => { obj.hipaaMetadata = value; } }, metadata: _metadata }, _hipaaMetadata_initializers, _hipaaMetadata_extraInitializers);
        __esDecorate(null, null, _includeInComplianceReport_decorators, { kind: "field", name: "includeInComplianceReport", static: false, private: false, access: { has: obj => "includeInComplianceReport" in obj, get: obj => obj.includeInComplianceReport, set: (obj, value) => { obj.includeInComplianceReport = value; } }, metadata: _metadata }, _includeInComplianceReport_initializers, _includeInComplianceReport_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditEvent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditEvent = _classThis;
})();
exports.AuditEvent = AuditEvent;
