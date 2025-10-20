"use strict";
/**
 * AuditEvent Entity - Database entity for audit trail events
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
exports.AuditEvent = void 0;
const typeorm_1 = require("typeorm");
let AuditEvent = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('audit_events'), (0, typeorm_1.Index)(['userId']), (0, typeorm_1.Index)(['action']), (0, typeorm_1.Index)(['resourceType']), (0, typeorm_1.Index)(['timestamp']), (0, typeorm_1.Index)(['riskLevel'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _userId_decorators;
    let _userId_initializers = [];
    let _userId_extraInitializers = [];
    let _userEmail_decorators;
    let _userEmail_initializers = [];
    let _userEmail_extraInitializers = [];
    let _userRole_decorators;
    let _userRole_initializers = [];
    let _userRole_extraInitializers = [];
    let _action_decorators;
    let _action_initializers = [];
    let _action_extraInitializers = [];
    let _resource_decorators;
    let _resource_initializers = [];
    let _resource_extraInitializers = [];
    let _resourceId_decorators;
    let _resourceId_initializers = [];
    let _resourceId_extraInitializers = [];
    let _resourceType_decorators;
    let _resourceType_initializers = [];
    let _resourceType_extraInitializers = [];
    let _outcome_decorators;
    let _outcome_initializers = [];
    let _outcome_extraInitializers = [];
    let _ipAddress_decorators;
    let _ipAddress_initializers = [];
    let _ipAddress_extraInitializers = [];
    let _userAgent_decorators;
    let _userAgent_initializers = [];
    let _userAgent_extraInitializers = [];
    let _sessionId_decorators;
    let _sessionId_initializers = [];
    let _sessionId_extraInitializers = [];
    let _details_decorators;
    let _details_initializers = [];
    let _details_extraInitializers = [];
    let _riskLevel_decorators;
    let _riskLevel_initializers = [];
    let _riskLevel_extraInitializers = [];
    let _complianceFlags_decorators;
    let _complianceFlags_initializers = [];
    let _complianceFlags_extraInitializers = [];
    let _dataClassification_decorators;
    let _dataClassification_initializers = [];
    let _dataClassification_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    var AuditEvent = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.timestamp = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
            this.userId = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.userEmail = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _userEmail_initializers, void 0));
            this.userRole = (__runInitializers(this, _userEmail_extraInitializers), __runInitializers(this, _userRole_initializers, void 0));
            this.action = (__runInitializers(this, _userRole_extraInitializers), __runInitializers(this, _action_initializers, void 0));
            this.resource = (__runInitializers(this, _action_extraInitializers), __runInitializers(this, _resource_initializers, void 0));
            this.resourceId = (__runInitializers(this, _resource_extraInitializers), __runInitializers(this, _resourceId_initializers, void 0));
            this.resourceType = (__runInitializers(this, _resourceId_extraInitializers), __runInitializers(this, _resourceType_initializers, void 0));
            this.outcome = (__runInitializers(this, _resourceType_extraInitializers), __runInitializers(this, _outcome_initializers, void 0));
            this.ipAddress = (__runInitializers(this, _outcome_extraInitializers), __runInitializers(this, _ipAddress_initializers, void 0));
            this.userAgent = (__runInitializers(this, _ipAddress_extraInitializers), __runInitializers(this, _userAgent_initializers, void 0));
            this.sessionId = (__runInitializers(this, _userAgent_extraInitializers), __runInitializers(this, _sessionId_initializers, void 0));
            this.details = (__runInitializers(this, _sessionId_extraInitializers), __runInitializers(this, _details_initializers, void 0));
            this.riskLevel = (__runInitializers(this, _details_extraInitializers), __runInitializers(this, _riskLevel_initializers, void 0));
            this.complianceFlags = (__runInitializers(this, _riskLevel_extraInitializers), __runInitializers(this, _complianceFlags_initializers, void 0));
            this.dataClassification = (__runInitializers(this, _complianceFlags_extraInitializers), __runInitializers(this, _dataClassification_initializers, void 0));
            this.createdAt = (__runInitializers(this, _dataClassification_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "AuditEvent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _timestamp_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })];
        _userId_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _userEmail_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _userRole_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _action_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _resource_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _resourceId_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _resourceType_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['user', 'patient', 'appointment', 'file', 'system', 'configuration', 'api_key', 'backup'],
            })];
        _outcome_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['success', 'failure', 'warning'],
            })];
        _ipAddress_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 45 })];
        _userAgent_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _sessionId_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _details_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _riskLevel_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low'
            })];
        _complianceFlags_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _dataClassification_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['public', 'internal', 'confidential', 'restricted', 'phi'],
                nullable: true
            })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId, set: (obj, value) => { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _userEmail_decorators, { kind: "field", name: "userEmail", static: false, private: false, access: { has: obj => "userEmail" in obj, get: obj => obj.userEmail, set: (obj, value) => { obj.userEmail = value; } }, metadata: _metadata }, _userEmail_initializers, _userEmail_extraInitializers);
        __esDecorate(null, null, _userRole_decorators, { kind: "field", name: "userRole", static: false, private: false, access: { has: obj => "userRole" in obj, get: obj => obj.userRole, set: (obj, value) => { obj.userRole = value; } }, metadata: _metadata }, _userRole_initializers, _userRole_extraInitializers);
        __esDecorate(null, null, _action_decorators, { kind: "field", name: "action", static: false, private: false, access: { has: obj => "action" in obj, get: obj => obj.action, set: (obj, value) => { obj.action = value; } }, metadata: _metadata }, _action_initializers, _action_extraInitializers);
        __esDecorate(null, null, _resource_decorators, { kind: "field", name: "resource", static: false, private: false, access: { has: obj => "resource" in obj, get: obj => obj.resource, set: (obj, value) => { obj.resource = value; } }, metadata: _metadata }, _resource_initializers, _resource_extraInitializers);
        __esDecorate(null, null, _resourceId_decorators, { kind: "field", name: "resourceId", static: false, private: false, access: { has: obj => "resourceId" in obj, get: obj => obj.resourceId, set: (obj, value) => { obj.resourceId = value; } }, metadata: _metadata }, _resourceId_initializers, _resourceId_extraInitializers);
        __esDecorate(null, null, _resourceType_decorators, { kind: "field", name: "resourceType", static: false, private: false, access: { has: obj => "resourceType" in obj, get: obj => obj.resourceType, set: (obj, value) => { obj.resourceType = value; } }, metadata: _metadata }, _resourceType_initializers, _resourceType_extraInitializers);
        __esDecorate(null, null, _outcome_decorators, { kind: "field", name: "outcome", static: false, private: false, access: { has: obj => "outcome" in obj, get: obj => obj.outcome, set: (obj, value) => { obj.outcome = value; } }, metadata: _metadata }, _outcome_initializers, _outcome_extraInitializers);
        __esDecorate(null, null, _ipAddress_decorators, { kind: "field", name: "ipAddress", static: false, private: false, access: { has: obj => "ipAddress" in obj, get: obj => obj.ipAddress, set: (obj, value) => { obj.ipAddress = value; } }, metadata: _metadata }, _ipAddress_initializers, _ipAddress_extraInitializers);
        __esDecorate(null, null, _userAgent_decorators, { kind: "field", name: "userAgent", static: false, private: false, access: { has: obj => "userAgent" in obj, get: obj => obj.userAgent, set: (obj, value) => { obj.userAgent = value; } }, metadata: _metadata }, _userAgent_initializers, _userAgent_extraInitializers);
        __esDecorate(null, null, _sessionId_decorators, { kind: "field", name: "sessionId", static: false, private: false, access: { has: obj => "sessionId" in obj, get: obj => obj.sessionId, set: (obj, value) => { obj.sessionId = value; } }, metadata: _metadata }, _sessionId_initializers, _sessionId_extraInitializers);
        __esDecorate(null, null, _details_decorators, { kind: "field", name: "details", static: false, private: false, access: { has: obj => "details" in obj, get: obj => obj.details, set: (obj, value) => { obj.details = value; } }, metadata: _metadata }, _details_initializers, _details_extraInitializers);
        __esDecorate(null, null, _riskLevel_decorators, { kind: "field", name: "riskLevel", static: false, private: false, access: { has: obj => "riskLevel" in obj, get: obj => obj.riskLevel, set: (obj, value) => { obj.riskLevel = value; } }, metadata: _metadata }, _riskLevel_initializers, _riskLevel_extraInitializers);
        __esDecorate(null, null, _complianceFlags_decorators, { kind: "field", name: "complianceFlags", static: false, private: false, access: { has: obj => "complianceFlags" in obj, get: obj => obj.complianceFlags, set: (obj, value) => { obj.complianceFlags = value; } }, metadata: _metadata }, _complianceFlags_initializers, _complianceFlags_extraInitializers);
        __esDecorate(null, null, _dataClassification_decorators, { kind: "field", name: "dataClassification", static: false, private: false, access: { has: obj => "dataClassification" in obj, get: obj => obj.dataClassification, set: (obj, value) => { obj.dataClassification = value; } }, metadata: _metadata }, _dataClassification_initializers, _dataClassification_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditEvent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditEvent = _classThis;
})();
exports.AuditEvent = AuditEvent;
