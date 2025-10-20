"use strict";
/**
 * AdminUser Entity - Database entity for admin users
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
exports.AdminUser = void 0;
const typeorm_1 = require("typeorm");
let AdminUser = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('admin_users'), (0, typeorm_1.Index)(['email'], { unique: true }), (0, typeorm_1.Index)(['role'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _passwordHash_decorators;
    let _passwordHash_initializers = [];
    let _passwordHash_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _permissions_decorators;
    let _permissions_initializers = [];
    let _permissions_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _isVerified_decorators;
    let _isVerified_initializers = [];
    let _isVerified_extraInitializers = [];
    let _mfaEnabled_decorators;
    let _mfaEnabled_initializers = [];
    let _mfaEnabled_extraInitializers = [];
    let _totpSecret_decorators;
    let _totpSecret_initializers = [];
    let _totpSecret_extraInitializers = [];
    let _backupCodes_decorators;
    let _backupCodes_initializers = [];
    let _backupCodes_extraInitializers = [];
    let _lastLoginIp_decorators;
    let _lastLoginIp_initializers = [];
    let _lastLoginIp_extraInitializers = [];
    let _lastLoginAt_decorators;
    let _lastLoginAt_initializers = [];
    let _lastLoginAt_extraInitializers = [];
    let _lastPasswordChangeAt_decorators;
    let _lastPasswordChangeAt_initializers = [];
    let _lastPasswordChangeAt_extraInitializers = [];
    let _failedLoginAttempts_decorators;
    let _failedLoginAttempts_initializers = [];
    let _failedLoginAttempts_extraInitializers = [];
    let _lockedUntil_decorators;
    let _lockedUntil_initializers = [];
    let _lockedUntil_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _createdBy_decorators;
    let _createdBy_initializers = [];
    let _createdBy_extraInitializers = [];
    let _updatedBy_decorators;
    let _updatedBy_initializers = [];
    let _updatedBy_extraInitializers = [];
    var AdminUser = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.firstName = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
            this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
            this.passwordHash = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _passwordHash_initializers, void 0));
            this.role = (__runInitializers(this, _passwordHash_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.permissions = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _permissions_initializers, void 0));
            this.isActive = (__runInitializers(this, _permissions_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.isVerified = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _isVerified_initializers, void 0));
            this.mfaEnabled = (__runInitializers(this, _isVerified_extraInitializers), __runInitializers(this, _mfaEnabled_initializers, void 0));
            this.totpSecret = (__runInitializers(this, _mfaEnabled_extraInitializers), __runInitializers(this, _totpSecret_initializers, void 0));
            this.backupCodes = (__runInitializers(this, _totpSecret_extraInitializers), __runInitializers(this, _backupCodes_initializers, void 0));
            this.lastLoginIp = (__runInitializers(this, _backupCodes_extraInitializers), __runInitializers(this, _lastLoginIp_initializers, void 0));
            this.lastLoginAt = (__runInitializers(this, _lastLoginIp_extraInitializers), __runInitializers(this, _lastLoginAt_initializers, void 0));
            this.lastPasswordChangeAt = (__runInitializers(this, _lastLoginAt_extraInitializers), __runInitializers(this, _lastPasswordChangeAt_initializers, void 0));
            this.failedLoginAttempts = (__runInitializers(this, _lastPasswordChangeAt_extraInitializers), __runInitializers(this, _failedLoginAttempts_initializers, void 0));
            this.lockedUntil = (__runInitializers(this, _failedLoginAttempts_extraInitializers), __runInitializers(this, _lockedUntil_initializers, void 0));
            this.metadata = (__runInitializers(this, _lockedUntil_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.createdAt = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.createdBy = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
            this.updatedBy = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _updatedBy_initializers, void 0));
            __runInitializers(this, _updatedBy_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "AdminUser");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _email_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true })];
        _firstName_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _lastName_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _passwordHash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['admin', 'compliance_officer', 'security_officer', 'performance_engineer', 'auditor', 'api_manager', 'dba', 'network_engineer', 'privacy_officer', 'risk_manager'],
                default: 'admin'
            })];
        _permissions_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _isActive_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _isVerified_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _mfaEnabled_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _totpSecret_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true })];
        _backupCodes_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _lastLoginIp_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true })];
        _lastLoginAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _lastPasswordChangeAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _failedLoginAttempts_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _lockedUntil_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _createdBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _updatedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
        __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
        __esDecorate(null, null, _passwordHash_decorators, { kind: "field", name: "passwordHash", static: false, private: false, access: { has: obj => "passwordHash" in obj, get: obj => obj.passwordHash, set: (obj, value) => { obj.passwordHash = value; } }, metadata: _metadata }, _passwordHash_initializers, _passwordHash_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _permissions_decorators, { kind: "field", name: "permissions", static: false, private: false, access: { has: obj => "permissions" in obj, get: obj => obj.permissions, set: (obj, value) => { obj.permissions = value; } }, metadata: _metadata }, _permissions_initializers, _permissions_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _isVerified_decorators, { kind: "field", name: "isVerified", static: false, private: false, access: { has: obj => "isVerified" in obj, get: obj => obj.isVerified, set: (obj, value) => { obj.isVerified = value; } }, metadata: _metadata }, _isVerified_initializers, _isVerified_extraInitializers);
        __esDecorate(null, null, _mfaEnabled_decorators, { kind: "field", name: "mfaEnabled", static: false, private: false, access: { has: obj => "mfaEnabled" in obj, get: obj => obj.mfaEnabled, set: (obj, value) => { obj.mfaEnabled = value; } }, metadata: _metadata }, _mfaEnabled_initializers, _mfaEnabled_extraInitializers);
        __esDecorate(null, null, _totpSecret_decorators, { kind: "field", name: "totpSecret", static: false, private: false, access: { has: obj => "totpSecret" in obj, get: obj => obj.totpSecret, set: (obj, value) => { obj.totpSecret = value; } }, metadata: _metadata }, _totpSecret_initializers, _totpSecret_extraInitializers);
        __esDecorate(null, null, _backupCodes_decorators, { kind: "field", name: "backupCodes", static: false, private: false, access: { has: obj => "backupCodes" in obj, get: obj => obj.backupCodes, set: (obj, value) => { obj.backupCodes = value; } }, metadata: _metadata }, _backupCodes_initializers, _backupCodes_extraInitializers);
        __esDecorate(null, null, _lastLoginIp_decorators, { kind: "field", name: "lastLoginIp", static: false, private: false, access: { has: obj => "lastLoginIp" in obj, get: obj => obj.lastLoginIp, set: (obj, value) => { obj.lastLoginIp = value; } }, metadata: _metadata }, _lastLoginIp_initializers, _lastLoginIp_extraInitializers);
        __esDecorate(null, null, _lastLoginAt_decorators, { kind: "field", name: "lastLoginAt", static: false, private: false, access: { has: obj => "lastLoginAt" in obj, get: obj => obj.lastLoginAt, set: (obj, value) => { obj.lastLoginAt = value; } }, metadata: _metadata }, _lastLoginAt_initializers, _lastLoginAt_extraInitializers);
        __esDecorate(null, null, _lastPasswordChangeAt_decorators, { kind: "field", name: "lastPasswordChangeAt", static: false, private: false, access: { has: obj => "lastPasswordChangeAt" in obj, get: obj => obj.lastPasswordChangeAt, set: (obj, value) => { obj.lastPasswordChangeAt = value; } }, metadata: _metadata }, _lastPasswordChangeAt_initializers, _lastPasswordChangeAt_extraInitializers);
        __esDecorate(null, null, _failedLoginAttempts_decorators, { kind: "field", name: "failedLoginAttempts", static: false, private: false, access: { has: obj => "failedLoginAttempts" in obj, get: obj => obj.failedLoginAttempts, set: (obj, value) => { obj.failedLoginAttempts = value; } }, metadata: _metadata }, _failedLoginAttempts_initializers, _failedLoginAttempts_extraInitializers);
        __esDecorate(null, null, _lockedUntil_decorators, { kind: "field", name: "lockedUntil", static: false, private: false, access: { has: obj => "lockedUntil" in obj, get: obj => obj.lockedUntil, set: (obj, value) => { obj.lockedUntil = value; } }, metadata: _metadata }, _lockedUntil_initializers, _lockedUntil_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: obj => "createdBy" in obj, get: obj => obj.createdBy, set: (obj, value) => { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _updatedBy_decorators, { kind: "field", name: "updatedBy", static: false, private: false, access: { has: obj => "updatedBy" in obj, get: obj => obj.updatedBy, set: (obj, value) => { obj.updatedBy = value; } }, metadata: _metadata }, _updatedBy_initializers, _updatedBy_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminUser = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminUser = _classThis;
})();
exports.AdminUser = AdminUser;
