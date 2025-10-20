"use strict";
/**
 * AdminModule - System administration dashboard module
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
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const database_module_1 = require("./database.module");
const common_2 = require("@clinic/common");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const admin_utils_service_1 = require("./admin-utils.service");
const admin_setup_controller_1 = require("./admin-setup.controller");
const admin_setup_service_1 = require("./admin-setup.service");
const security_controller_1 = require("../security/security.controller");
const security_service_1 = require("../security/security.service");
const backup_controller_1 = require("../backup/backup.controller");
const backup_service_1 = require("../backup/backup.service");
const monitoring_controller_1 = require("../monitoring/monitoring.controller");
const monitoring_service_1 = require("../monitoring/monitoring.service");
const config_controller_1 = require("../config/config.controller");
const config_service_1 = require("../config/config.service");
const compliance_controller_1 = require("../compliance/compliance.controller");
const compliance_service_1 = require("../compliance/compliance.service");
const api_management_controller_1 = require("../api-management/api-management.controller");
const api_management_service_1 = require("../api-management/api-management.service");
const performance_controller_1 = require("../performance/performance.controller");
const performance_service_1 = require("../performance/performance.service");
const admin_database_service_1 = require("./admin-database.service");
const common_3 = require("@clinic/common");
let AdminModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                axios_1.HttpModule,
                database_module_1.DatabaseModule,
                common_2.ComplianceModule.register({ isGlobal: false }), // Add compliance services for admin features
            ],
            controllers: [admin_controller_1.AdminController, admin_setup_controller_1.AdminSetupController, security_controller_1.SecurityController, backup_controller_1.BackupController, monitoring_controller_1.MonitoringController, config_controller_1.ConfigController, compliance_controller_1.ComplianceController, api_management_controller_1.ApiManagementController, performance_controller_1.PerformanceController],
            providers: [admin_service_1.AdminService, admin_utils_service_1.AdminUtilsService, admin_setup_service_1.AdminSetupService, security_service_1.SecurityService, backup_service_1.BackupService, monitoring_service_1.MonitoringService, config_service_1.ConfigService, compliance_service_1.ComplianceService, api_management_service_1.ApiManagementService, performance_service_1.PerformanceService, admin_database_service_1.AdminDatabaseService, common_3.JwtService],
            exports: [admin_service_1.AdminService, admin_utils_service_1.AdminUtilsService, admin_setup_service_1.AdminSetupService, security_service_1.SecurityService, backup_service_1.BackupService, monitoring_service_1.MonitoringService, config_service_1.ConfigService, compliance_service_1.ComplianceService, api_management_service_1.ApiManagementService, performance_service_1.PerformanceService, admin_database_service_1.AdminDatabaseService, database_module_1.DatabaseModule],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdminModule = _classThis = class {
    };
    __setFunctionName(_classThis, "AdminModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminModule = _classThis;
})();
exports.AdminModule = AdminModule;
