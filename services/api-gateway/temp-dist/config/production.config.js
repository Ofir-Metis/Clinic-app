"use strict";
/**
 * Production Configuration Service
 * Centralized configuration for production-ready API Gateway
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
exports.ProductionConfigService = void 0;
const common_1 = require("@nestjs/common");
let ProductionConfigService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ProductionConfigService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(ProductionConfigService.name);
            this.validateRequiredConfig();
            this.logConfigurationStatus();
        }
        getDatabaseConfig() {
            return {
                host: this.configService.get('POSTGRES_HOST', 'localhost'),
                port: this.configService.get('POSTGRES_PORT', 5432),
                username: this.configService.get('POSTGRES_USER', 'postgres'),
                password: this.configService.get('POSTGRES_PASSWORD', 'postgres'),
                database: this.configService.get('POSTGRES_DB', 'clinic'),
                ssl: this.configService.get('DATABASE_SSL_ENABLED', 'false') === 'true',
                poolSize: this.configService.get('DB_POOL_SIZE', 20),
                connectionTimeout: this.configService.get('DB_CONNECTION_TIMEOUT', 10000),
                queryTimeout: this.configService.get('DB_QUERY_TIMEOUT', 30000),
            };
        }
        getSecurityConfig() {
            const jwtSecret = this.configService.get('JWT_SECRET');
            if (!jwtSecret || jwtSecret.length < 32) {
                throw new Error('JWT_SECRET must be at least 32 characters long for production');
            }
            return {
                jwtSecret,
                jwtExpirationTime: this.configService.get('JWT_EXPIRES_IN', '24h'),
                bcryptRounds: this.configService.get('BCRYPT_ROUNDS', 12),
                corsOrigins: this.getCorsOrigins(),
                rateLimitWindow: this.configService.get('RATE_LIMIT_WINDOW', 60000), // 1 minute
                rateLimitMax: this.configService.get('RATE_LIMIT_MAX', 100),
                maxRequestSize: this.configService.get('MAX_REQUEST_SIZE', '10mb'),
            };
        }
        getServiceConfig() {
            return {
                natsUrl: this.configService.get('NATS_URL', 'nats://localhost:4222'),
                redisHost: this.configService.get('REDIS_HOST', 'localhost'),
                redisPort: this.configService.get('REDIS_PORT', 6379),
                microserviceTimeout: this.configService.get('MICROSERVICE_TIMEOUT', 5000),
                circuitBreakerTimeout: this.configService.get('CIRCUIT_BREAKER_TIMEOUT', 3000),
                circuitBreakerThreshold: this.configService.get('CIRCUIT_BREAKER_THRESHOLD', 5),
            };
        }
        getMonitoringConfig() {
            const nodeEnv = this.configService.get('NODE_ENV', 'development');
            return {
                enableMetrics: this.configService.get('ENABLE_METRICS', 'true') === 'true',
                enableTracing: this.configService.get('ENABLE_TRACING', nodeEnv === 'production' ? 'true' : 'false') === 'true',
                logLevel: this.configService.get('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug'),
                healthCheckInterval: this.configService.get('HEALTH_CHECK_INTERVAL', 30000),
                enableApiDocs: this.configService.get('ENABLE_API_DOCS', nodeEnv !== 'production' ? 'true' : 'false') === 'true',
            };
        }
        getPort() {
            const port = this.configService.get('PORT', 3000);
            if (port < 1 || port > 65535) {
                throw new Error('PORT must be a valid port number (1-65535)');
            }
            return port;
        }
        getNodeEnv() {
            return this.configService.get('NODE_ENV', 'development');
        }
        isProduction() {
            return this.getNodeEnv() === 'production';
        }
        getCorsOrigins() {
            const corsOrigins = this.configService.get('CORS_ORIGINS');
            if (corsOrigins) {
                return corsOrigins.split(',').map(origin => origin.trim());
            }
            // Default development origins
            if (!this.isProduction()) {
                return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'];
            }
            // Production should always specify CORS origins
            this.logger.warn('CORS_ORIGINS not specified for production environment');
            return [];
        }
        validateRequiredConfig() {
            const requiredVars = [
                'JWT_SECRET',
                'POSTGRES_HOST',
                'POSTGRES_USER',
                'POSTGRES_PASSWORD',
                'POSTGRES_DB'
            ];
            const missing = requiredVars.filter(varName => {
                const value = this.configService.get(varName);
                return !value || value.trim().length === 0;
            });
            if (missing.length > 0) {
                throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
            }
            // Additional validation for production
            if (this.isProduction()) {
                const productionVars = ['CORS_ORIGINS', 'REDIS_HOST'];
                const missingProd = productionVars.filter(varName => !this.configService.get(varName));
                if (missingProd.length > 0) {
                    this.logger.warn(`Missing recommended production environment variables: ${missingProd.join(', ')}`);
                }
            }
        }
        logConfigurationStatus() {
            const dbConfig = this.getDatabaseConfig();
            const securityConfig = this.getSecurityConfig();
            const serviceConfig = this.getServiceConfig();
            const monitoringConfig = this.getMonitoringConfig();
            this.logger.log('🔧 Production Configuration Status:');
            this.logger.log(`   Environment: ${this.getNodeEnv()}`);
            this.logger.log(`   Port: ${this.getPort()}`);
            this.logger.log(`   Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (SSL: ${dbConfig.ssl})`);
            this.logger.log(`   NATS: ${serviceConfig.natsUrl}`);
            this.logger.log(`   Redis: ${serviceConfig.redisHost}:${serviceConfig.redisPort}`);
            this.logger.log(`   CORS Origins: ${securityConfig.corsOrigins.length} configured`);
            this.logger.log(`   Rate Limiting: ${securityConfig.rateLimitMax} requests per ${securityConfig.rateLimitWindow}ms`);
            this.logger.log(`   Metrics: ${monitoringConfig.enableMetrics ? 'Enabled' : 'Disabled'}`);
            this.logger.log(`   API Docs: ${monitoringConfig.enableApiDocs ? 'Enabled' : 'Disabled'}`);
            this.logger.log(`   Log Level: ${monitoringConfig.logLevel}`);
        }
        // Health check configuration status
        getHealthStatus() {
            return {
                environment: this.getNodeEnv(),
                configuration: {
                    database: this.getDatabaseConfig(),
                    security: {
                        ...this.getSecurityConfig(),
                        jwtSecret: '[REDACTED]' // Don't expose secret in health checks
                    },
                    services: this.getServiceConfig(),
                    monitoring: this.getMonitoringConfig()
                },
                timestamp: new Date().toISOString()
            };
        }
    };
    __setFunctionName(_classThis, "ProductionConfigService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductionConfigService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductionConfigService = _classThis;
})();
exports.ProductionConfigService = ProductionConfigService;
