/**
 * Main application entry point for Search Service
 * Advanced search capabilities with Elasticsearch
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Search-Service');

  try {
    logger.log('🚀 Starting Search Service...');

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
      app.use(new LoggingMiddleware(loggerService).use);
    }
    
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production'
    }));

    // CORS configuration
    app.enableCors({
      origin: [
        configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000', // For development
        'http://localhost:4000', // API Gateway
        ...(configService.get<string>('ALLOWED_ORIGINS')?.split(',') || []),
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
        .setTitle('Search Service')
        .setDescription('Advanced search capabilities with Elasticsearch')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Search', 'Search operations and queries')
        .addTag('Indexing', 'Content indexing and data synchronization')
        .addTag('Autocomplete', 'Search suggestions and autocomplete')
        .addTag('Health', 'Service health checks')
        .addServer('http://localhost:3010', 'Development')
        .addServer('https://api.clinic.com', 'Production')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log('📚 Swagger documentation available at http://localhost:3010/docs');
    }

    // Connect to NATS microservice
    const natsUrl = configService.get<string>('NATS_URL', 'nats://localhost:4222');
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        queue: 'search-service',
      },
    });

    await app.startAllMicroservices();
    logger.log(`🔗 Connected to NATS message broker at ${natsUrl}`);

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'search-service',
        timestamp: new Date().toISOString(),
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: '1.0.0',
        features: {
          elasticsearch: true,
          nats: true,
          logging: !!loggerService,
        },
      });
    });

    // Start the server
    const port = configService.get<number>('PORT', 3010);
    await app.listen(port, '0.0.0.0');

    logger.log(`🎉 Search Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/docs`);
    logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
    logger.log(`🔍 Ready to provide advanced search capabilities`);
    
  } catch (error) {
    logger.error('💥 Failed to start Search Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('SearchService');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('SearchService');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();