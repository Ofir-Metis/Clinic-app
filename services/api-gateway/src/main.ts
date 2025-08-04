import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter, SanitizationPipe, RequestSizeLimitMiddleware, CsrfSetupMiddleware, SecurityHeadersMiddleware } from '@clinic/common';
import { LoggingMiddleware } from '@clinic/common';
import { LoggingInterceptor } from '@clinic/common';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerConfig } from './docs/swagger-config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

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

  // Global middleware and filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new SecurityHeadersMiddleware(app.get('ConfigService')).use);
  app.use(new LoggingMiddleware().use);
  app.use(new RequestSizeLimitMiddleware(app.get('ConfigService')).use.bind(new RequestSizeLimitMiddleware(app.get('ConfigService'))));
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

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Documentation
  const enableDocs = process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true';
  
  if (enableDocs) {
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

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 API Gateway running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
