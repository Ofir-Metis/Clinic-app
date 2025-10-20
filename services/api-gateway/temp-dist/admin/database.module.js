"use strict";
/**
 * DatabaseModule - TypeORM configuration for admin database operations
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
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
// Entities
const admin_user_entity_1 = require("./entities/admin-user.entity");
const api_key_entity_1 = require("./entities/api-key.entity");
const audit_event_entity_1 = require("./entities/audit-event.entity");
const system_config_entity_1 = require("./entities/system-config.entity");
const system_alert_entity_1 = require("./entities/system-alert.entity");
const backup_job_entity_1 = require("./entities/backup-job.entity");
const performance_metric_entity_1 = require("./entities/performance-metric.entity");
// Repositories
const admin_user_repository_1 = require("./repositories/admin-user.repository");
const api_key_repository_1 = require("./repositories/api-key.repository");
const audit_event_repository_1 = require("./repositories/audit-event.repository");
const performance_metric_repository_1 = require("./repositories/performance-metric.repository");
let DatabaseModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                // Use the shared database connection from CommonModule
                // Remove duplicate TypeOrmModule.forRootAsync to prevent connection pool conflicts
                typeorm_1.TypeOrmModule.forFeature([
                    admin_user_entity_1.AdminUser,
                    api_key_entity_1.ApiKey,
                    audit_event_entity_1.AuditEvent,
                    system_config_entity_1.SystemConfig,
                    system_alert_entity_1.SystemAlert,
                    backup_job_entity_1.BackupJob,
                    performance_metric_entity_1.PerformanceMetric,
                ]),
            ],
            providers: [
                admin_user_repository_1.AdminUserRepository,
                api_key_repository_1.ApiKeyRepository,
                audit_event_repository_1.AuditEventRepository,
                performance_metric_repository_1.PerformanceMetricRepository,
            ],
            exports: [
                typeorm_1.TypeOrmModule,
                admin_user_repository_1.AdminUserRepository,
                api_key_repository_1.ApiKeyRepository,
                audit_event_repository_1.AuditEventRepository,
                performance_metric_repository_1.PerformanceMetricRepository,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DatabaseModule = _classThis = class {
    };
    __setFunctionName(_classThis, "DatabaseModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DatabaseModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DatabaseModule = _classThis;
})();
exports.DatabaseModule = DatabaseModule;
