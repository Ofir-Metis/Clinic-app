/**
 * Main application entry point for CDN Service
 * Content Delivery Network for static assets and media optimization
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('CDN-Service');

  try {
    logger.log('🚀 Starting CDN Service...');

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

    // Security middleware - Applied before other middleware for CDN
    app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable for CDN assets
    }));

    // Compression middleware for better performance
    app.use(compression());

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

    // CORS configuration for CDN - Allow all origins for static assets
    app.enableCors({
      origin: true, // Allow all origins for CDN assets
      credentials: false,
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'If-None-Match'],
      exposedHeaders: ['ETag', 'Cache-Control', 'Content-Type', 'Content-Disposition'],
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // Swagger/OpenAPI Documentation
    if (configService.get<string>('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('CDN Service')
        .setDescription('Content Delivery Network for static assets and media optimization')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Assets', 'Asset management and delivery')
        .addTag('CDN', 'Content delivery and cache management')
        .addTag('Optimization', 'Image and media optimization')
        .addTag('S3', 'S3/CloudFront integration')
        .addTag('Health', 'Service health checks')
        .addServer('http://localhost:3011', 'Development')
        .addServer('https://cdn.clinic.com', 'Production')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log('📚 Swagger documentation available at http://localhost:3011/docs');
    }

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'cdn-service',
        timestamp: new Date().toISOString(),
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: '1.0.0',
        features: {
          s3: !!configService.get<string>('AWS_S3_BUCKET_NAME'),
          cloudfront: !!configService.get<string>('AWS_CLOUDFRONT_DOMAIN'),
          compression: true,
          helmet: true,
          logging: !!loggerService,
        },
      });
    });

    // Start the server
    const port = configService.get<number>('CDN_PORT', 3011);
    await app.listen(port, '0.0.0.0');

    logger.log(`🎉 CDN Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/docs`);
    logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
    logger.log(`🚀 Ready to deliver optimized content and assets`);
    
    // Log CDN configuration status
    const hasS3 = !!configService.get<string>('AWS_S3_BUCKET_NAME');
    const hasCloudFront = !!configService.get<string>('AWS_CLOUDFRONT_DOMAIN');
    logger.log(`📦 S3 configured: ${hasS3 ? '✅' : '❌'}`);
    logger.log(`☁️ CloudFront configured: ${hasCloudFront ? '✅' : '❌'}`);
    
  } catch (error) {
    logger.error('💥 Failed to start CDN Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('CDNService');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('CDNService');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();