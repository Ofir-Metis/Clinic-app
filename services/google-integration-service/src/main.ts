/**
 * Main application entry point for Google Integration Service
 * Starts the NestJS microservice
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('GoogleIntegrationService');
  
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
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
        .setTitle('Google Integration Service')
        .setDescription('Google Workspace integration for clinic management system')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Google OAuth', 'Authentication and account management')
        .addTag('Calendar', 'Google Calendar synchronization')
        .addTag('Gmail', 'Email communication')
        .addServer('http://localhost:3009', 'Development')
        .addServer('https://api.clinic.com', 'Production')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log('📚 Swagger documentation available at http://localhost:3009/docs');
    }

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'google-integration-service',
        timestamp: new Date().toISOString(),
        environment: configService.get<string>('NODE_ENV', 'development'),
        version: '1.0.0',
      });
    });

    // Start the server
    const port = configService.get<number>('PORT', 3009);
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Google Integration Service started on port ${port}`);
    logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
    logger.log(`🗄️  Database: ${configService.get<string>('DATABASE_HOST', 'localhost')}:${configService.get<number>('DATABASE_PORT', 5432)}`);
    
    // Log Google OAuth configuration status
    const hasGoogleConfig = !!(
      configService.get<string>('GOOGLE_CLIENT_ID') && 
      configService.get<string>('GOOGLE_CLIENT_SECRET') && 
      configService.get<string>('GOOGLE_REDIRECT_URI')
    );
    logger.log(`🔑 Google OAuth configured: ${hasGoogleConfig ? '✅' : '❌'}`);

    if (!hasGoogleConfig) {
      logger.warn('⚠️  Google OAuth not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.');
    }

  } catch (error) {
    logger.error('❌ Failed to start Google Integration Service:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('GoogleIntegrationService');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('GoogleIntegrationService');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();