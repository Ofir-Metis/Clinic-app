"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@clinic/common");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const swagger_1 = require("@nestjs/swagger");
const swagger_config_1 = require("./docs/swagger-config");
const production_config_1 = require("./config/production.config");
const metrics_interceptor_1 = require("./common/metrics.interceptor");
const metrics_service_1 = require("./monitoring/metrics.service");
async function bootstrap() {
    const logger = new common_2.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    // Get production configuration service
    let productionConfig, monitoringConfig, securityConfig;
    try {
        productionConfig = app.get(production_config_1.ProductionConfigService);
        monitoringConfig = productionConfig.getMonitoringConfig();
        securityConfig = productionConfig.getSecurityConfig();
    }
    catch (error) {
        logger.warn('⚠️ ProductionConfigService not available, using fallback config');
        productionConfig = {
            isProduction: () => process.env.NODE_ENV === 'production',
            getPort: () => process.env.PORT || 3000,
            getNodeEnv: () => process.env.NODE_ENV || 'development'
        };
        monitoringConfig = { enableMetrics: false, enableApiDocs: false };
        securityConfig = { corsOrigins: ['http://localhost:5173', 'http://localhost:5174'] };
    }
    // Security Configuration - Disable helmet CSP since we use custom headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Handled by SecurityHeadersMiddleware
        hsts: false, // Handled by SecurityHeadersMiddleware
        frameguard: false, // Handled by SecurityHeadersMiddleware
        noSniff: false, // Handled by SecurityHeadersMiddleware
        xssFilter: false, // Handled by SecurityHeadersMiddleware
        referrerPolicy: false, // Handled by SecurityHeadersMiddleware
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        originAgentCluster: false,
    }));
    // Performance optimizations
    app.use((0, compression_1.default)());
    // Get essential services
    const configService = app.get(config_1.ConfigService);
    // Create logger service instance with error handling
    let loggerService = null;
    try {
        loggerService = app.get(common_1.CentralizedLoggerService);
        logger.log('✅ CentralizedLoggerService initialized successfully');
    }
    catch (error) {
        logger.warn('⚠️ CentralizedLoggerService not available, using fallback logging');
        logger.warn(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    // Production-ready metrics collection
    if (monitoringConfig.enableMetrics) {
        try {
            const metricsService = app.get(metrics_service_1.MetricsService);
            app.useGlobalInterceptors(new metrics_interceptor_1.MetricsInterceptor(metricsService));
            logger.log('✅ Metrics collection enabled');
        }
        catch (error) {
            logger.warn('⚠️ MetricsService not available, skipping metrics');
        }
    }
    // Global middleware and filters
    if (loggerService) {
        app.useGlobalInterceptors(new common_1.LoggingInterceptor(loggerService));
        // app.use(new LoggingMiddleware(loggerService).use); // Temporarily disabled for production stability
    }
    app.useGlobalFilters(new common_1.AllExceptionsFilter());
    // Apply security headers middleware - Fixed: Use proper DI pattern
    const securityHeadersMiddleware = new common_1.SecurityHeadersMiddleware(configService);
    app.use((req, res, next) => {
        try {
            securityHeadersMiddleware.use(req, res, next);
        }
        catch (error) {
            logger.error('SecurityHeadersMiddleware error:', error);
            next(); // Continue even if security headers fail
        }
    });
    const requestSizeLimitMiddleware = new common_1.RequestSizeLimitMiddleware(configService);
    app.use(requestSizeLimitMiddleware.use.bind(requestSizeLimitMiddleware));
    app.use(new common_1.CsrfSetupMiddleware().use);
    // Input validation and sanitization
    app.useGlobalPipes(new common_1.SanitizationPipe(), // Sanitize input first
    new common_2.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    // CORS configuration using production config
    app.enableCors({
        origin: productionConfig.isProduction() ? securityConfig.corsOrigins : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    // API Documentation using production config
    if (monitoringConfig.enableApiDocs) {
        const config = swagger_config_1.SwaggerConfig.createConfig();
        const options = swagger_config_1.SwaggerConfig.createOptions();
        const customOptions = swagger_config_1.SwaggerConfig.getCustomOptions();
        const document = swagger_1.SwaggerModule.createDocument(app, config, options);
        swagger_1.SwaggerModule.setup('api-docs', app, document, customOptions);
        logger.log('📚 API Documentation available at /api-docs');
        logger.log('🔒 Remember to authenticate before testing endpoints');
    }
    // Graceful shutdown
    const gracefulShutdown = () => {
        logger.log('Received termination signal, shutting down gracefully...');
        app.close().then(() => {
            logger.log('Application closed successfully');
            process.exit(0);
        });
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    const port = productionConfig.getPort();
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 API Gateway running on port ${port}`);
    logger.log(`Environment: ${productionConfig.getNodeEnv()}`);
    logger.log(`Health check: http://localhost:${port}/health`);
    if (monitoringConfig.enableMetrics) {
        logger.log(`📊 Metrics available at: http://localhost:${port}/metrics`);
        logger.log(`📈 Prometheus metrics: http://localhost:${port}/metrics/prometheus`);
    }
    if (monitoringConfig.enableApiDocs) {
        logger.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    }
}
bootstrap().catch((error) => {
    const logger = new common_2.Logger('Bootstrap');
    logger.error('Failed to start application:', error);
    process.exit(1);
});
