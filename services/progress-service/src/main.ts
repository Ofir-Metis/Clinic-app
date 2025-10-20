/**
 * Main application entry point for Progress Service
 * Manages client progress tracking, goals, milestones, and achievements
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Progress-Service');

  try {
    logger.log('🚀 Starting Progress Service...');

    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    
    // Create logger service instances with error handling
    let loggerService: CentralizedLoggerService | null = null;
    try {
      loggerService = app.get(CentralizedLoggerService);
      logger.log('✅ CentralizedLoggerService initialized successfully');
    } catch (error) {
      logger.warn('⚠️ CentralizedLoggerService not available, using fallback logging');
      logger.warn(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Global middleware and filters with conditional logger
    if (loggerService) {
      app.useGlobalInterceptors(new LoggingInterceptor(loggerService));
      const loggingMiddleware = new LoggingMiddleware(loggerService);
      app.use((req, res, next) => loggingMiddleware.use(req, res, next));
    }
    
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production'
    }));

    // CORS configuration
    app.enableCors({
      origin: [
        configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000', // For development
        'http://localhost:4000', // API Gateway
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // Swagger/OpenAPI Documentation
    if (configService.get<string>('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Progress Service')
        .setDescription('Client progress tracking, goals, milestones, and achievements management')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Progress', 'Client progress tracking and analytics')
        .addTag('Goals', 'Goal setting and management')
        .addTag('Milestones', 'Milestone tracking and achievements')
        .addTag('Categories', 'Goal category management')
        .addTag('Health', 'Service health checks')
        .addServer('http://localhost:3015', 'Development')
        .addServer('https://api.clinic.com', 'Production')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log('📚 Swagger documentation available at http://localhost:3015/docs');
    }

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'progress-service',
        timestamp: new Date().toISOString(),
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: '1.0.0',
        features: {
          database: true,
          logging: !!loggerService,
        },
      });
    });

    // Start the server
    const port = configService.get<number>('PORT', 3015);
    await app.listen(port, '0.0.0.0');

    logger.log(`🎉 Progress Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/docs`);
    logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
    logger.log(`📈 Ready to track client progress and achievements`);
    
  } catch (error) {
    logger.error('💥 Failed to start Progress Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('ProgressService');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('ProgressService');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
