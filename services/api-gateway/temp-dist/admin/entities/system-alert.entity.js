"use strict";
/**
 * SystemAlert Entity - Database entity for system alerts
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
exports.SystemAlert = void 0;
const typeorm_1 = require("typeorm");
let SystemAlert = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('system_alerts'), (0, typeorm_1.Index)(['severity']), (0, typeorm_1.Index)(['status']), (0, typeorm_1.Index)(['service']), (0, typeorm_1.Index)(['alertType']), (0, typeorm_1.Index)(['resolvedAt'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _severity_decorators;
    let _severity_initializers = [];
    let _severity_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _alertType_decorators;
    let _alertType_initializers = [];
    let _alertType_extraInitializers = [];
    let _service_decorators;
    let _service_initializers = [];
    let _service_extraInitializers = [];
    let _metric_decorators;
    let _metric_initializers = [];
    let _metric_extraInitializers = [];
    let _threshold_decorators;
    let _threshold_initializers = [];
    let _threshold_extraInitializers = [];
    let _currentValue_decorators;
    let _currentValue_initializers = [];
    let _currentValue_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _actionsTaken_decorators;
    let _actionsTaken_initializers = [];
    let _actionsTaken_extraInitializers = [];
    let _resolution_decorators;
    let _resolution_initializers = [];
    let _resolution_extraInitializers = [];
    let _acknowledgedAt_decorators;
    let _acknowledgedAt_initializers = [];
    let _acknowledgedAt_extraInitializers = [];
    let _acknowledgedBy_decorators;
    let _acknowledgedBy_initializers = [];
    let _acknowledgedBy_extraInitializers = [];
    let _resolvedAt_decorators;
    let _resolvedAt_initializers = [];
    let _resolvedAt_extraInitializers = [];
    let _resolvedBy_decorators;
    let _resolvedBy_initializers = [];
    let _resolvedBy_extraInitializers = [];
    let _count_decorators;
    let _count_initializers = [];
    let _count_extraInitializers = [];
    let _lastOccurrence_decorators;
    let _lastOccurrence_initializers = [];
    let _lastOccurrence_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    var SystemAlert = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.title = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
            this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.severity = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
            this.status = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.alertType = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _alertType_initializers, void 0));
            this.service = (__runInitializers(this, _alertType_extraInitializers), __runInitializers(this, _service_initializers, void 0));
            this.metric = (__runInitializers(this, _service_extraInitializers), __runInitializers(this, _metric_initializers, void 0));
            this.threshold = (__runInitializers(this, _metric_extraInitializers), __runInitializers(this, _threshold_initializers, void 0));
            this.currentValue = (__runInitializers(this, _threshold_extraInitializers), __runInitializers(this, _currentValue_initializers, void 0));
            this.metadata = (__runInitializers(this, _currentValue_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.actionsTaken = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _actionsTaken_initializers, void 0));
            this.resolution = (__runInitializers(this, _actionsTaken_extraInitializers), __runInitializers(this, _resolution_initializers, void 0));
            this.acknowledgedAt = (__runInitializers(this, _resolution_extraInitializers), __runInitializers(this, _acknowledgedAt_initializers, void 0));
            this.acknowledgedBy = (__runInitializers(this, _acknowledgedAt_extraInitializers), __runInitializers(this, _acknowledgedBy_initializers, void 0));
            this.resolvedAt = (__runInitializers(this, _acknowledgedBy_extraInitializers), __runInitializers(this, _resolvedAt_initializers, void 0));
            this.resolvedBy = (__runInitializers(this, _resolvedAt_extraInitializers), __runInitializers(this, _resolvedBy_initializers, void 0));
            this.count = (__runInitializers(this, _resolvedBy_extraInitializers), __runInitializers(this, _count_initializers, void 0));
            this.lastOccurrence = (__runInitializers(this, _count_extraInitializers), __runInitializers(this, _lastOccurrence_initializers, void 0));
            this.createdAt = (__runInitializers(this, _lastOccurrence_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "SystemAlert");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _title_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _severity_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['info', 'warning', 'error', 'critical'],
                default: 'info'
            })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['active', 'acknowledged', 'resolved', 'suppressed'],
                default: 'active'
            })];
        _alertType_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['system', 'performance', 'security', 'backup', 'compliance', 'api', 'database'],
            })];
        _service_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _metric_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _threshold_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true })];
        _currentValue_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _actionsTaken_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _resolution_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _acknowledgedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _acknowledgedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _resolvedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _resolvedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _count_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 1 })];
        _lastOccurrence_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: obj => "severity" in obj, get: obj => obj.severity, set: (obj, value) => { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _alertType_decorators, { kind: "field", name: "alertType", static: false, private: false, access: { has: obj => "alertType" in obj, get: obj => obj.alertType, set: (obj, value) => { obj.alertType = value; } }, metadata: _metadata }, _alertType_initializers, _alertType_extraInitializers);
        __esDecorate(null, null, _service_decorators, { kind: "field", name: "service", static: false, private: false, access: { has: obj => "service" in obj, get: obj => obj.service, set: (obj, value) => { obj.service = value; } }, metadata: _metadata }, _service_initializers, _service_extraInitializers);
        __esDecorate(null, null, _metric_decorators, { kind: "field", name: "metric", static: false, private: false, access: { has: obj => "metric" in obj, get: obj => obj.metric, set: (obj, value) => { obj.metric = value; } }, metadata: _metadata }, _metric_initializers, _metric_extraInitializers);
        __esDecorate(null, null, _threshold_decorators, { kind: "field", name: "threshold", static: false, private: false, access: { has: obj => "threshold" in obj, get: obj => obj.threshold, set: (obj, value) => { obj.threshold = value; } }, metadata: _metadata }, _threshold_initializers, _threshold_extraInitializers);
        __esDecorate(null, null, _currentValue_decorators, { kind: "field", name: "currentValue", static: false, private: false, access: { has: obj => "currentValue" in obj, get: obj => obj.currentValue, set: (obj, value) => { obj.currentValue = value; } }, metadata: _metadata }, _currentValue_initializers, _currentValue_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _actionsTaken_decorators, { kind: "field", name: "actionsTaken", static: false, private: false, access: { has: obj => "actionsTaken" in obj, get: obj => obj.actionsTaken, set: (obj, value) => { obj.actionsTaken = value; } }, metadata: _metadata }, _actionsTaken_initializers, _actionsTaken_extraInitializers);
        __esDecorate(null, null, _resolution_decorators, { kind: "field", name: "resolution", static: false, private: false, access: { has: obj => "resolution" in obj, get: obj => obj.resolution, set: (obj, value) => { obj.resolution = value; } }, metadata: _metadata }, _resolution_initializers, _resolution_extraInitializers);
        __esDecorate(null, null, _acknowledgedAt_decorators, { kind: "field", name: "acknowledgedAt", static: false, private: false, access: { has: obj => "acknowledgedAt" in obj, get: obj => obj.acknowledgedAt, set: (obj, value) => { obj.acknowledgedAt = value; } }, metadata: _metadata }, _acknowledgedAt_initializers, _acknowledgedAt_extraInitializers);
        __esDecorate(null, null, _acknowledgedBy_decorators, { kind: "field", name: "acknowledgedBy", static: false, private: false, access: { has: obj => "acknowledgedBy" in obj, get: obj => obj.acknowledgedBy, set: (obj, value) => { obj.acknowledgedBy = value; } }, metadata: _metadata }, _acknowledgedBy_initializers, _acknowledgedBy_extraInitializers);
        __esDecorate(null, null, _resolvedAt_decorators, { kind: "field", name: "resolvedAt", static: false, private: false, access: { has: obj => "resolvedAt" in obj, get: obj => obj.resolvedAt, set: (obj, value) => { obj.resolvedAt = value; } }, metadata: _metadata }, _resolvedAt_initializers, _resolvedAt_extraInitializers);
        __esDecorate(null, null, _resolvedBy_decorators, { kind: "field", name: "resolvedBy", static: false, private: false, access: { has: obj => "resolvedBy" in obj, get: obj => obj.resolvedBy, set: (obj, value) => { obj.resolvedBy = value; } }, metadata: _metadata }, _resolvedBy_initializers, _resolvedBy_extraInitializers);
        __esDecorate(null, null, _count_decorators, { kind: "field", name: "count", static: false, private: false, access: { has: obj => "count" in obj, get: obj => obj.count, set: (obj, value) => { obj.count = value; } }, metadata: _metadata }, _count_initializers, _count_extraInitializers);
        __esDecorate(null, null, _lastOccurrence_decorators, { kind: "field", name: "lastOccurrence", static: false, private: false, access: { has: obj => "lastOccurrence" in obj, get: obj => obj.lastOccurrence, set: (obj, value) => { obj.lastOccurrence = value; } }, metadata: _metadata }, _lastOccurrence_initializers, _lastOccurrence_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SystemAlert = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SystemAlert = _classThis;
})();
exports.SystemAlert = SystemAlert;
