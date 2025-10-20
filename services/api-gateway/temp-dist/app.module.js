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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const common_2 = require("@clinic/common");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const settings_module_1 = require("./settings/settings.module");
const admin_module_1 = require("./admin/admin.module");
// import { EncryptionModule } from './encryption/encryption.module'; // Temporarily disabled for debugging
// import { DisasterRecoveryModule } from './disaster-recovery/disaster-recovery.module'; // Disabled due to BusinessContinuityService dependency
// import { DatabaseOptimizationModule } from './database-optimization/database-optimization.module'; // Temporarily disabled for import issues
// import { SecurityMonitoringModule } from './security-monitoring/security-monitoring.module'; // Temporarily disabled for import issues
const monitoring_module_1 = require("./monitoring/monitoring.module");
// import { DataRetentionModule } from './data-retention/data-retention.module'; // Temporarily disabled
const audit_module_1 = require("./audit/audit.module");
const resilience_module_1 = require("./resilience/resilience.module");
const app_resolver_1 = require("./app.resolver");
const health_controller_1 = require("./health/health.controller");
const dashboard_service_1 = require("./dashboard/dashboard.service");
const settings_service_1 = require("./settings/settings.service");
const auth_controller_1 = require("./auth.controller");
const test_controller_1 = require("./test.controller");
let AppModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                // Use CommonModule which includes enterprise database configuration
                common_2.CommonModule,
                throttler_1.ThrottlerModule.forRoot([
                    {
                        name: 'strict',
                        ttl: 900000, // 15 minutes
                        limit: 5, // 5 requests per 15 minutes for sensitive endpoints
                    },
                    {
                        name: 'moderate',
                        ttl: 60000, // 1 minute
                        limit: 30, // 30 requests per minute for API endpoints
                    },
                    {
                        name: 'lenient',
                        ttl: 60000, // 1 minute
                        limit: 100, // 100 requests per minute for read operations
                    },
                    {
                        name: 'default',
                        ttl: 60000, // 1 minute
                        limit: 60, // Default 60 requests per minute
                    },
                ]),
                axios_1.HttpModule,
                graphql_1.GraphQLModule.forRoot({
                    driver: apollo_1.ApolloDriver,
                    autoSchemaFile: (0, path_1.join)(process.cwd(), 'gateway-schema.gql'),
                    cache: 'bounded', // Fix Apollo Server security vulnerability
                    persistedQueries: false, // Fix Apollo Server security vulnerability
                }),
                dashboard_module_1.DashboardModule,
                // TherapistsModule, // Keep disabled - may have dependencies
                settings_module_1.SettingsModule,
                // WebSocketModule, // Keep disabled - complex dependencies
                // RecordingsModule, // Keep disabled - storage dependencies
                // GoogleModule, // Keep disabled - OAuth dependencies
                // OnboardingModule, // Keep disabled
                // ProgramsModule, // Keep disabled
                // AIModule, // Keep disabled
                // AnalyticsModule, // Keep disabled
                // ViewSwitchingModule, // Keep disabled
                admin_module_1.AdminModule,
                // ComplianceModule, // Keep disabled - HIPAA dependencies
                // EncryptionModule, // Temporarily disabled for debugging
                // DisasterRecoveryModule, // Temporarily disabled
                // DatabaseOptimizationModule, // Temporarily disabled for import issues
                // SecurityMonitoringModule, // Temporarily disabled for import issues
                monitoring_module_1.MonitoringModule,
                // DataRetentionModule, // Keep disabled - complex dependencies
                audit_module_1.AuditModule,
                resilience_module_1.ResilienceModule,
                // CsrfModule, // Already included in CommonModule
                // SecurityHeadersModule, // Already included in CommonModule
            ],
            controllers: [auth_controller_1.AuthController, health_controller_1.HealthController, test_controller_1.TestController],
            providers: [
                dashboard_service_1.DashboardService,
                settings_service_1.SettingsService,
                // TherapistsService, // Keep disabled - may have circular dependencies
                app_resolver_1.AppResolver,
                {
                    provide: core_1.APP_GUARD,
                    useClass: throttler_1.ThrottlerGuard,
                },
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = _classThis = class {
    };
    __setFunctionName(_classThis, "AppModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
})();
exports.AppModule = AppModule;
