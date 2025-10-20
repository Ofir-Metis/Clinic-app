import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter, SanitizationPipe, RequestSizeLimitMiddleware, CsrfSetupMiddleware, SecurityHeadersMiddleware, LoggingMiddleware, LoggingInterceptor, CentralizedLoggerService } from '@clinic/common';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerConfig } from './docs/swagger-config';
import { ProductionConfigService } from './config/production.config';
import { MetricsInterceptor } from './common/metrics.interceptor';
import { MetricsService } from './monitoring/metrics.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Get production configuration service
  let productionConfig, monitoringConfig, securityConfig;
  try {
    productionConfig = app.get(ProductionConfigService);
    monitoringConfig = productionConfig.getMonitoringConfig();
    securityConfig = productionConfig.getSecurityConfig();
  } catch (error) {
    logger.warn('⚠️ ProductionConfigService not available, using fallback config');
    productionConfig = {
      isProduction: () => process.env.NODE_ENV === 'production',
      getPort: () => process.env.PORT || 3000,
      getNodeEnv: () => process.env.NODE_ENV || 'development'
    };
    monitoringConfig = { enableMetrics: false, enableApiDocs: false };
    securityConfig = { 
      corsOrigins: [
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://10.100.102.17:5173',
        'http://10.100.102.17:4000'
      ] 
    };
  }

  // Security Configuration - Disable helmet CSP since we use custom headers
  app.use(helmet({
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
  app.use(compression());

  // Get essential services
  const configService = app.get(ConfigService);
  
  // Create logger service instance with error handling
  let loggerService: CentralizedLoggerService | null = null;
  try {
    loggerService = app.get(CentralizedLoggerService);
    logger.log('✅ CentralizedLoggerService initialized successfully');
  } catch (error) {
    logger.warn('⚠️ CentralizedLoggerService not available, using fallback logging');
    logger.warn(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Production-ready metrics collection
  if (monitoringConfig.enableMetrics) {
    try {
      const metricsService = app.get(MetricsService);
      app.useGlobalInterceptors(new MetricsInterceptor(metricsService));
      logger.log('✅ Metrics collection enabled');
    } catch (error) {
      logger.warn('⚠️ MetricsService not available, skipping metrics');
    }
  }
  
  // Global middleware and filters
  if (loggerService) {
    app.useGlobalInterceptors(new LoggingInterceptor(loggerService));
    // app.use(new LoggingMiddleware(loggerService).use); // Temporarily disabled for production stability
  }
  app.useGlobalFilters(new AllExceptionsFilter());
  // Apply security headers middleware - Fixed: Use proper DI pattern
  const securityHeadersMiddleware = new SecurityHeadersMiddleware(configService);
  app.use((req: any, res: any, next: any) => {
    try {
      securityHeadersMiddleware.use(req, res, next);
    } catch (error) {
      logger.error('SecurityHeadersMiddleware error:', error);
      next(); // Continue even if security headers fail
    }
  });
  
  const requestSizeLimitMiddleware = new RequestSizeLimitMiddleware(configService);
  app.use(requestSizeLimitMiddleware.use.bind(requestSizeLimitMiddleware));
  app.use(new CsrfSetupMiddleware().use);

  // Input validation and sanitization
  app.useGlobalPipes(
    new SanitizationPipe(), // Sanitize input first
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // CORS configuration using production config
  app.enableCors({
    origin: productionConfig.isProduction() ? securityConfig.corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Documentation using production config
  if (monitoringConfig.enableApiDocs) {
    const config = SwaggerConfig.createConfig();
    const options = SwaggerConfig.createOptions();
    const customOptions = SwaggerConfig.getCustomOptions();
    
    const document = SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup('api-docs', app, document, customOptions);
    
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
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
