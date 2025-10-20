"use strict";
/**
 * BackupJob Entity - Database entity for backup jobs
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
exports.BackupJob = void 0;
const typeorm_1 = require("typeorm");
let BackupJob = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('backup_jobs'), (0, typeorm_1.Index)(['status']), (0, typeorm_1.Index)(['type']), (0, typeorm_1.Index)(['scheduledAt']), (0, typeorm_1.Index)(['completedAt'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _sources_decorators;
    let _sources_initializers = [];
    let _sources_extraInitializers = [];
    let _destination_decorators;
    let _destination_initializers = [];
    let _destination_extraInitializers = [];
    let _encrypted_decorators;
    let _encrypted_initializers = [];
    let _encrypted_extraInitializers = [];
    let _compressed_decorators;
    let _compressed_initializers = [];
    let _compressed_extraInitializers = [];
    let _schedule_decorators;
    let _schedule_initializers = [];
    let _schedule_extraInitializers = [];
    let _retentionDays_decorators;
    let _retentionDays_initializers = [];
    let _retentionDays_extraInitializers = [];
    let _scheduledAt_decorators;
    let _scheduledAt_initializers = [];
    let _scheduledAt_extraInitializers = [];
    let _startedAt_decorators;
    let _startedAt_initializers = [];
    let _startedAt_extraInitializers = [];
    let _completedAt_decorators;
    let _completedAt_initializers = [];
    let _completedAt_extraInitializers = [];
    let _sizeBytes_decorators;
    let _sizeBytes_initializers = [];
    let _sizeBytes_extraInitializers = [];
    let _fileCount_decorators;
    let _fileCount_initializers = [];
    let _fileCount_extraInitializers = [];
    let _progressPercentage_decorators;
    let _progressPercentage_initializers = [];
    let _progressPercentage_extraInitializers = [];
    let _errorMessage_decorators;
    let _errorMessage_initializers = [];
    let _errorMessage_extraInitializers = [];
    let _logs_decorators;
    let _logs_initializers = [];
    let _logs_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _checksumHash_decorators;
    let _checksumHash_initializers = [];
    let _checksumHash_extraInitializers = [];
    let _verified_decorators;
    let _verified_initializers = [];
    let _verified_extraInitializers = [];
    let _verifiedAt_decorators;
    let _verifiedAt_initializers = [];
    let _verifiedAt_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    let _createdBy_decorators;
    let _createdBy_initializers = [];
    let _createdBy_extraInitializers = [];
    let _cancelledBy_decorators;
    let _cancelledBy_initializers = [];
    let _cancelledBy_extraInitializers = [];
    var BackupJob = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.type = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.status = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.sources = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _sources_initializers, void 0));
            this.destination = (__runInitializers(this, _sources_extraInitializers), __runInitializers(this, _destination_initializers, void 0));
            this.encrypted = (__runInitializers(this, _destination_extraInitializers), __runInitializers(this, _encrypted_initializers, void 0));
            this.compressed = (__runInitializers(this, _encrypted_extraInitializers), __runInitializers(this, _compressed_initializers, void 0));
            this.schedule = (__runInitializers(this, _compressed_extraInitializers), __runInitializers(this, _schedule_initializers, void 0)); // cron expression
            this.retentionDays = (__runInitializers(this, _schedule_extraInitializers), __runInitializers(this, _retentionDays_initializers, void 0));
            this.scheduledAt = (__runInitializers(this, _retentionDays_extraInitializers), __runInitializers(this, _scheduledAt_initializers, void 0));
            this.startedAt = (__runInitializers(this, _scheduledAt_extraInitializers), __runInitializers(this, _startedAt_initializers, void 0));
            this.completedAt = (__runInitializers(this, _startedAt_extraInitializers), __runInitializers(this, _completedAt_initializers, void 0));
            this.sizeBytes = (__runInitializers(this, _completedAt_extraInitializers), __runInitializers(this, _sizeBytes_initializers, void 0));
            this.fileCount = (__runInitializers(this, _sizeBytes_extraInitializers), __runInitializers(this, _fileCount_initializers, void 0));
            this.progressPercentage = (__runInitializers(this, _fileCount_extraInitializers), __runInitializers(this, _progressPercentage_initializers, void 0));
            this.errorMessage = (__runInitializers(this, _progressPercentage_extraInitializers), __runInitializers(this, _errorMessage_initializers, void 0));
            this.logs = (__runInitializers(this, _errorMessage_extraInitializers), __runInitializers(this, _logs_initializers, void 0));
            this.metadata = (__runInitializers(this, _logs_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.checksumHash = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _checksumHash_initializers, void 0));
            this.verified = (__runInitializers(this, _checksumHash_extraInitializers), __runInitializers(this, _verified_initializers, void 0));
            this.verifiedAt = (__runInitializers(this, _verified_extraInitializers), __runInitializers(this, _verifiedAt_initializers, void 0));
            this.createdAt = (__runInitializers(this, _verifiedAt_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.createdBy = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
            this.cancelledBy = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _cancelledBy_initializers, void 0));
            __runInitializers(this, _cancelledBy_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "BackupJob");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _type_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['full', 'incremental', 'differential', 'snapshot'],
                default: 'full'
            })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
                default: 'pending'
            })];
        _sources_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _destination_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _encrypted_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _compressed_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _schedule_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _retentionDays_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 30 })];
        _scheduledAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _startedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _completedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _sizeBytes_decorators = [(0, typeorm_1.Column)({ type: 'bigint', nullable: true })];
        _fileCount_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _progressPercentage_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })];
        _errorMessage_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _logs_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _checksumHash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _verified_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _verifiedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _createdBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _cancelledBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _sources_decorators, { kind: "field", name: "sources", static: false, private: false, access: { has: obj => "sources" in obj, get: obj => obj.sources, set: (obj, value) => { obj.sources = value; } }, metadata: _metadata }, _sources_initializers, _sources_extraInitializers);
        __esDecorate(null, null, _destination_decorators, { kind: "field", name: "destination", static: false, private: false, access: { has: obj => "destination" in obj, get: obj => obj.destination, set: (obj, value) => { obj.destination = value; } }, metadata: _metadata }, _destination_initializers, _destination_extraInitializers);
        __esDecorate(null, null, _encrypted_decorators, { kind: "field", name: "encrypted", static: false, private: false, access: { has: obj => "encrypted" in obj, get: obj => obj.encrypted, set: (obj, value) => { obj.encrypted = value; } }, metadata: _metadata }, _encrypted_initializers, _encrypted_extraInitializers);
        __esDecorate(null, null, _compressed_decorators, { kind: "field", name: "compressed", static: false, private: false, access: { has: obj => "compressed" in obj, get: obj => obj.compressed, set: (obj, value) => { obj.compressed = value; } }, metadata: _metadata }, _compressed_initializers, _compressed_extraInitializers);
        __esDecorate(null, null, _schedule_decorators, { kind: "field", name: "schedule", static: false, private: false, access: { has: obj => "schedule" in obj, get: obj => obj.schedule, set: (obj, value) => { obj.schedule = value; } }, metadata: _metadata }, _schedule_initializers, _schedule_extraInitializers);
        __esDecorate(null, null, _retentionDays_decorators, { kind: "field", name: "retentionDays", static: false, private: false, access: { has: obj => "retentionDays" in obj, get: obj => obj.retentionDays, set: (obj, value) => { obj.retentionDays = value; } }, metadata: _metadata }, _retentionDays_initializers, _retentionDays_extraInitializers);
        __esDecorate(null, null, _scheduledAt_decorators, { kind: "field", name: "scheduledAt", static: false, private: false, access: { has: obj => "scheduledAt" in obj, get: obj => obj.scheduledAt, set: (obj, value) => { obj.scheduledAt = value; } }, metadata: _metadata }, _scheduledAt_initializers, _scheduledAt_extraInitializers);
        __esDecorate(null, null, _startedAt_decorators, { kind: "field", name: "startedAt", static: false, private: false, access: { has: obj => "startedAt" in obj, get: obj => obj.startedAt, set: (obj, value) => { obj.startedAt = value; } }, metadata: _metadata }, _startedAt_initializers, _startedAt_extraInitializers);
        __esDecorate(null, null, _completedAt_decorators, { kind: "field", name: "completedAt", static: false, private: false, access: { has: obj => "completedAt" in obj, get: obj => obj.completedAt, set: (obj, value) => { obj.completedAt = value; } }, metadata: _metadata }, _completedAt_initializers, _completedAt_extraInitializers);
        __esDecorate(null, null, _sizeBytes_decorators, { kind: "field", name: "sizeBytes", static: false, private: false, access: { has: obj => "sizeBytes" in obj, get: obj => obj.sizeBytes, set: (obj, value) => { obj.sizeBytes = value; } }, metadata: _metadata }, _sizeBytes_initializers, _sizeBytes_extraInitializers);
        __esDecorate(null, null, _fileCount_decorators, { kind: "field", name: "fileCount", static: false, private: false, access: { has: obj => "fileCount" in obj, get: obj => obj.fileCount, set: (obj, value) => { obj.fileCount = value; } }, metadata: _metadata }, _fileCount_initializers, _fileCount_extraInitializers);
        __esDecorate(null, null, _progressPercentage_decorators, { kind: "field", name: "progressPercentage", static: false, private: false, access: { has: obj => "progressPercentage" in obj, get: obj => obj.progressPercentage, set: (obj, value) => { obj.progressPercentage = value; } }, metadata: _metadata }, _progressPercentage_initializers, _progressPercentage_extraInitializers);
        __esDecorate(null, null, _errorMessage_decorators, { kind: "field", name: "errorMessage", static: false, private: false, access: { has: obj => "errorMessage" in obj, get: obj => obj.errorMessage, set: (obj, value) => { obj.errorMessage = value; } }, metadata: _metadata }, _errorMessage_initializers, _errorMessage_extraInitializers);
        __esDecorate(null, null, _logs_decorators, { kind: "field", name: "logs", static: false, private: false, access: { has: obj => "logs" in obj, get: obj => obj.logs, set: (obj, value) => { obj.logs = value; } }, metadata: _metadata }, _logs_initializers, _logs_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _checksumHash_decorators, { kind: "field", name: "checksumHash", static: false, private: false, access: { has: obj => "checksumHash" in obj, get: obj => obj.checksumHash, set: (obj, value) => { obj.checksumHash = value; } }, metadata: _metadata }, _checksumHash_initializers, _checksumHash_extraInitializers);
        __esDecorate(null, null, _verified_decorators, { kind: "field", name: "verified", static: false, private: false, access: { has: obj => "verified" in obj, get: obj => obj.verified, set: (obj, value) => { obj.verified = value; } }, metadata: _metadata }, _verified_initializers, _verified_extraInitializers);
        __esDecorate(null, null, _verifiedAt_decorators, { kind: "field", name: "verifiedAt", static: false, private: false, access: { has: obj => "verifiedAt" in obj, get: obj => obj.verifiedAt, set: (obj, value) => { obj.verifiedAt = value; } }, metadata: _metadata }, _verifiedAt_initializers, _verifiedAt_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: obj => "createdBy" in obj, get: obj => obj.createdBy, set: (obj, value) => { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _cancelledBy_decorators, { kind: "field", name: "cancelledBy", static: false, private: false, access: { has: obj => "cancelledBy" in obj, get: obj => obj.cancelledBy, set: (obj, value) => { obj.cancelledBy = value; } }, metadata: _metadata }, _cancelledBy_initializers, _cancelledBy_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BackupJob = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BackupJob = _classThis;
})();
exports.BackupJob = BackupJob;
