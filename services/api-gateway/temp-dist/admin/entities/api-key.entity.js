"use strict";
/**
 * ApiKey Entity - Database entity for API keys
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
exports.ApiKey = void 0;
const typeorm_1 = require("typeorm");
let ApiKey = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('api_keys'), (0, typeorm_1.Index)(['clientId']), (0, typeorm_1.Index)(['status']), (0, typeorm_1.Index)(['keyHash'], { unique: true })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _keyHash_decorators;
    let _keyHash_initializers = [];
    let _keyHash_extraInitializers = [];
    let _keyPreview_decorators;
    let _keyPreview_initializers = [];
    let _keyPreview_extraInitializers = [];
    let _clientId_decorators;
    let _clientId_initializers = [];
    let _clientId_extraInitializers = [];
    let _clientName_decorators;
    let _clientName_initializers = [];
    let _clientName_extraInitializers = [];
    let _permissions_decorators;
    let _permissions_initializers = [];
    let _permissions_extraInitializers = [];
    let _rateLimits_decorators;
    let _rateLimits_initializers = [];
    let _rateLimits_extraInitializers = [];
    let _totalRequests_decorators;
    let _totalRequests_initializers = [];
    let _totalRequests_extraInitializers = [];
    let _requestsThisMonth_decorators;
    let _requestsThisMonth_initializers = [];
    let _requestsThisMonth_extraInitializers = [];
    let _lastUsed_decorators;
    let _lastUsed_initializers = [];
    let _lastUsed_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _revocationReason_decorators;
    let _revocationReason_initializers = [];
    let _revocationReason_extraInitializers = [];
    let _revokedAt_decorators;
    let _revokedAt_initializers = [];
    let _revokedAt_extraInitializers = [];
    let _revokedBy_decorators;
    let _revokedBy_initializers = [];
    let _revokedBy_extraInitializers = [];
    let _regeneratedAt_decorators;
    let _regeneratedAt_initializers = [];
    let _regeneratedAt_extraInitializers = [];
    let _regeneratedBy_decorators;
    let _regeneratedBy_initializers = [];
    let _regeneratedBy_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _createdBy_decorators;
    let _createdBy_initializers = [];
    let _createdBy_extraInitializers = [];
    var ApiKey = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.keyHash = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _keyHash_initializers, void 0));
            this.keyPreview = (__runInitializers(this, _keyHash_extraInitializers), __runInitializers(this, _keyPreview_initializers, void 0));
            this.clientId = (__runInitializers(this, _keyPreview_extraInitializers), __runInitializers(this, _clientId_initializers, void 0));
            this.clientName = (__runInitializers(this, _clientId_extraInitializers), __runInitializers(this, _clientName_initializers, void 0));
            this.permissions = (__runInitializers(this, _clientName_extraInitializers), __runInitializers(this, _permissions_initializers, void 0));
            this.rateLimits = (__runInitializers(this, _permissions_extraInitializers), __runInitializers(this, _rateLimits_initializers, void 0));
            this.totalRequests = (__runInitializers(this, _rateLimits_extraInitializers), __runInitializers(this, _totalRequests_initializers, void 0));
            this.requestsThisMonth = (__runInitializers(this, _totalRequests_extraInitializers), __runInitializers(this, _requestsThisMonth_initializers, void 0));
            this.lastUsed = (__runInitializers(this, _requestsThisMonth_extraInitializers), __runInitializers(this, _lastUsed_initializers, void 0));
            this.status = (__runInitializers(this, _lastUsed_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.expiresAt = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
            this.metadata = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.revocationReason = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _revocationReason_initializers, void 0));
            this.revokedAt = (__runInitializers(this, _revocationReason_extraInitializers), __runInitializers(this, _revokedAt_initializers, void 0));
            this.revokedBy = (__runInitializers(this, _revokedAt_extraInitializers), __runInitializers(this, _revokedBy_initializers, void 0));
            this.regeneratedAt = (__runInitializers(this, _revokedBy_extraInitializers), __runInitializers(this, _regeneratedAt_initializers, void 0));
            this.regeneratedBy = (__runInitializers(this, _regeneratedAt_extraInitializers), __runInitializers(this, _regeneratedBy_initializers, void 0));
            this.createdAt = (__runInitializers(this, _regeneratedBy_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.createdBy = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
            __runInitializers(this, _createdBy_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "ApiKey");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _keyHash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64, unique: true })];
        _keyPreview_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 20 })];
        _clientId_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _clientName_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _permissions_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _rateLimits_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _totalRequests_decorators = [(0, typeorm_1.Column)({ type: 'bigint', default: 0 })];
        _requestsThisMonth_decorators = [(0, typeorm_1.Column)({ type: 'bigint', default: 0 })];
        _lastUsed_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['active', 'suspended', 'revoked'],
                default: 'active'
            })];
        _expiresAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _revocationReason_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _revokedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _revokedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _regeneratedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _regeneratedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _createdBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _keyHash_decorators, { kind: "field", name: "keyHash", static: false, private: false, access: { has: obj => "keyHash" in obj, get: obj => obj.keyHash, set: (obj, value) => { obj.keyHash = value; } }, metadata: _metadata }, _keyHash_initializers, _keyHash_extraInitializers);
        __esDecorate(null, null, _keyPreview_decorators, { kind: "field", name: "keyPreview", static: false, private: false, access: { has: obj => "keyPreview" in obj, get: obj => obj.keyPreview, set: (obj, value) => { obj.keyPreview = value; } }, metadata: _metadata }, _keyPreview_initializers, _keyPreview_extraInitializers);
        __esDecorate(null, null, _clientId_decorators, { kind: "field", name: "clientId", static: false, private: false, access: { has: obj => "clientId" in obj, get: obj => obj.clientId, set: (obj, value) => { obj.clientId = value; } }, metadata: _metadata }, _clientId_initializers, _clientId_extraInitializers);
        __esDecorate(null, null, _clientName_decorators, { kind: "field", name: "clientName", static: false, private: false, access: { has: obj => "clientName" in obj, get: obj => obj.clientName, set: (obj, value) => { obj.clientName = value; } }, metadata: _metadata }, _clientName_initializers, _clientName_extraInitializers);
        __esDecorate(null, null, _permissions_decorators, { kind: "field", name: "permissions", static: false, private: false, access: { has: obj => "permissions" in obj, get: obj => obj.permissions, set: (obj, value) => { obj.permissions = value; } }, metadata: _metadata }, _permissions_initializers, _permissions_extraInitializers);
        __esDecorate(null, null, _rateLimits_decorators, { kind: "field", name: "rateLimits", static: false, private: false, access: { has: obj => "rateLimits" in obj, get: obj => obj.rateLimits, set: (obj, value) => { obj.rateLimits = value; } }, metadata: _metadata }, _rateLimits_initializers, _rateLimits_extraInitializers);
        __esDecorate(null, null, _totalRequests_decorators, { kind: "field", name: "totalRequests", static: false, private: false, access: { has: obj => "totalRequests" in obj, get: obj => obj.totalRequests, set: (obj, value) => { obj.totalRequests = value; } }, metadata: _metadata }, _totalRequests_initializers, _totalRequests_extraInitializers);
        __esDecorate(null, null, _requestsThisMonth_decorators, { kind: "field", name: "requestsThisMonth", static: false, private: false, access: { has: obj => "requestsThisMonth" in obj, get: obj => obj.requestsThisMonth, set: (obj, value) => { obj.requestsThisMonth = value; } }, metadata: _metadata }, _requestsThisMonth_initializers, _requestsThisMonth_extraInitializers);
        __esDecorate(null, null, _lastUsed_decorators, { kind: "field", name: "lastUsed", static: false, private: false, access: { has: obj => "lastUsed" in obj, get: obj => obj.lastUsed, set: (obj, value) => { obj.lastUsed = value; } }, metadata: _metadata }, _lastUsed_initializers, _lastUsed_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _revocationReason_decorators, { kind: "field", name: "revocationReason", static: false, private: false, access: { has: obj => "revocationReason" in obj, get: obj => obj.revocationReason, set: (obj, value) => { obj.revocationReason = value; } }, metadata: _metadata }, _revocationReason_initializers, _revocationReason_extraInitializers);
        __esDecorate(null, null, _revokedAt_decorators, { kind: "field", name: "revokedAt", static: false, private: false, access: { has: obj => "revokedAt" in obj, get: obj => obj.revokedAt, set: (obj, value) => { obj.revokedAt = value; } }, metadata: _metadata }, _revokedAt_initializers, _revokedAt_extraInitializers);
        __esDecorate(null, null, _revokedBy_decorators, { kind: "field", name: "revokedBy", static: false, private: false, access: { has: obj => "revokedBy" in obj, get: obj => obj.revokedBy, set: (obj, value) => { obj.revokedBy = value; } }, metadata: _metadata }, _revokedBy_initializers, _revokedBy_extraInitializers);
        __esDecorate(null, null, _regeneratedAt_decorators, { kind: "field", name: "regeneratedAt", static: false, private: false, access: { has: obj => "regeneratedAt" in obj, get: obj => obj.regeneratedAt, set: (obj, value) => { obj.regeneratedAt = value; } }, metadata: _metadata }, _regeneratedAt_initializers, _regeneratedAt_extraInitializers);
        __esDecorate(null, null, _regeneratedBy_decorators, { kind: "field", name: "regeneratedBy", static: false, private: false, access: { has: obj => "regeneratedBy" in obj, get: obj => obj.regeneratedBy, set: (obj, value) => { obj.regeneratedBy = value; } }, metadata: _metadata }, _regeneratedBy_initializers, _regeneratedBy_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: obj => "createdBy" in obj, get: obj => obj.createdBy, set: (obj, value) => { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApiKey = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApiKey = _classThis;
})();
exports.ApiKey = ApiKey;
