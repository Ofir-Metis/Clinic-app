/**
 * Main application entry point for Client Relationships Service
 * Manages multi-coach client relationships, permissions, and goal sharing
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Client-Relationships-Service');

  try {
    logger.log('🚀 Starting Client Relationships Service...');

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
      // app.use(new LoggingMiddleware(loggerService).use); // Temporarily disabled for production stability
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
        .setTitle('Client Relationships Service')
        .setDescription('Multi-coach client relationships, permissions, and goal sharing management')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Clients', 'Client management and profiles')
        .addTag('Coaches', 'Coach management and specializations')
        .addTag('Relationships', 'Client-coach relationship management')
        .addTag('Permissions', 'Access control and permission management')
        .addTag('Goals', 'Goal setting and tracking')
        .addTag('Achievements', 'Achievement tracking and recognition')
        .addServer('http://localhost:3014', 'Development')
        .addServer('https://api.clinic.com', 'Production')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log('📚 Swagger documentation available at http://localhost:3014/docs');
    }

    // Connect to NATS microservice
    const natsUrl = configService.get<string>('NATS_URL');
    if (natsUrl) {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.NATS,
        options: {
          servers: [natsUrl],
          queue: 'client-relationships-service',
        },
      });
      await app.startAllMicroservices();
      logger.log(`🔗 Connected to NATS message broker at ${natsUrl}`);
    } else {
      logger.warn('⚠️ NATS_URL not configured. Microservice communication disabled.');
    }

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'client-relationships-service',
        timestamp: new Date().toISOString(),
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: '1.0.0',
        features: {
          nats: !!natsUrl,
          database: true,
          logging: !!loggerService,
        },
      });
    });

    // Start the server
    const port = configService.get<number>('PORT', 3014);
    await app.listen(port, '0.0.0.0');

    logger.log(`🎉 Client Relationships Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/docs`);
    logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
    logger.log(`👥 Ready to manage client-coach relationships and goals`);
    
  } catch (error) {
    logger.error('💥 Failed to start Client Relationships Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('ClientRelationshipsService');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('ClientRelationshipsService');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();