"use strict";
/**
 * SystemConfig Entity - Database entity for system configuration
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
exports.SystemConfig = void 0;
const typeorm_1 = require("typeorm");
let SystemConfig = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('system_configs'), (0, typeorm_1.Index)(['key', 'environment'], { unique: true }), (0, typeorm_1.Index)(['service']), (0, typeorm_1.Index)(['category']), (0, typeorm_1.Index)(['isSecret'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _key_decorators;
    let _key_initializers = [];
    let _key_extraInitializers = [];
    let _value_decorators;
    let _value_initializers = [];
    let _value_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _environment_decorators;
    let _environment_initializers = [];
    let _environment_extraInitializers = [];
    let _service_decorators;
    let _service_initializers = [];
    let _service_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _isSecret_decorators;
    let _isSecret_initializers = [];
    let _isSecret_extraInitializers = [];
    let _version_decorators;
    let _version_initializers = [];
    let _version_extraInitializers = [];
    let _tags_decorators;
    let _tags_initializers = [];
    let _tags_extraInitializers = [];
    let _validation_decorators;
    let _validation_initializers = [];
    let _validation_extraInitializers = [];
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
    let _modifiedBy_decorators;
    let _modifiedBy_initializers = [];
    let _modifiedBy_extraInitializers = [];
    var SystemConfig = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.key = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _key_initializers, void 0));
            this.value = (__runInitializers(this, _key_extraInitializers), __runInitializers(this, _value_initializers, void 0));
            this.type = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.environment = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _environment_initializers, void 0));
            this.service = (__runInitializers(this, _environment_extraInitializers), __runInitializers(this, _service_initializers, void 0));
            this.category = (__runInitializers(this, _service_extraInitializers), __runInitializers(this, _category_initializers, void 0));
            this.description = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.isSecret = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _isSecret_initializers, void 0));
            this.version = (__runInitializers(this, _isSecret_extraInitializers), __runInitializers(this, _version_initializers, void 0));
            this.tags = (__runInitializers(this, _version_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
            this.validation = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _validation_initializers, void 0));
            this.metadata = (__runInitializers(this, _validation_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.createdAt = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.createdBy = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
            this.modifiedBy = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _modifiedBy_initializers, void 0));
            __runInitializers(this, _modifiedBy_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "SystemConfig");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _key_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _value_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _type_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['string', 'number', 'boolean', 'json', 'encrypted'],
                default: 'string'
            })];
        _environment_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'production' })];
        _service_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _category_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _isSecret_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _version_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 1 })];
        _tags_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _validation_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _createdBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _modifiedBy_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _key_decorators, { kind: "field", name: "key", static: false, private: false, access: { has: obj => "key" in obj, get: obj => obj.key, set: (obj, value) => { obj.key = value; } }, metadata: _metadata }, _key_initializers, _key_extraInitializers);
        __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value, set: (obj, value) => { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: obj => "environment" in obj, get: obj => obj.environment, set: (obj, value) => { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
        __esDecorate(null, null, _service_decorators, { kind: "field", name: "service", static: false, private: false, access: { has: obj => "service" in obj, get: obj => obj.service, set: (obj, value) => { obj.service = value; } }, metadata: _metadata }, _service_initializers, _service_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _isSecret_decorators, { kind: "field", name: "isSecret", static: false, private: false, access: { has: obj => "isSecret" in obj, get: obj => obj.isSecret, set: (obj, value) => { obj.isSecret = value; } }, metadata: _metadata }, _isSecret_initializers, _isSecret_extraInitializers);
        __esDecorate(null, null, _version_decorators, { kind: "field", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version, set: (obj, value) => { obj.version = value; } }, metadata: _metadata }, _version_initializers, _version_extraInitializers);
        __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: obj => "tags" in obj, get: obj => obj.tags, set: (obj, value) => { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
        __esDecorate(null, null, _validation_decorators, { kind: "field", name: "validation", static: false, private: false, access: { has: obj => "validation" in obj, get: obj => obj.validation, set: (obj, value) => { obj.validation = value; } }, metadata: _metadata }, _validation_initializers, _validation_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: obj => "createdBy" in obj, get: obj => obj.createdBy, set: (obj, value) => { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _modifiedBy_decorators, { kind: "field", name: "modifiedBy", static: false, private: false, access: { has: obj => "modifiedBy" in obj, get: obj => obj.modifiedBy, set: (obj, value) => { obj.modifiedBy = value; } }, metadata: _metadata }, _modifiedBy_initializers, _modifiedBy_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SystemConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SystemConfig = _classThis;
})();
exports.SystemConfig = SystemConfig;
