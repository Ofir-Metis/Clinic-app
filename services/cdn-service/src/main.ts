import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StructuredLoggerService } from '@clinic/common';
import * as compression from 'compression';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Setup structured logging
  const logger = app.get(StructuredLoggerService);
  app.useLogger(logger);

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable for CDN assets
  }));

  // Compression middleware
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // CORS configuration for CDN
  app.enableCors({
    origin: true, // Allow all origins for CDN assets
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'If-None-Match'],
    exposedHeaders: ['ETag', 'Cache-Control', 'Content-Type', 'Content-Disposition'],
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Healthcare Platform CDN Service')
      .setDescription('Content Delivery Network for static assets and media optimization')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('assets', 'Asset management operations')
      .addTag('cdn', 'CDN operations and cache management')
      .addTag('optimization', 'Image and media optimization')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.CDN_PORT || 3011;
  await app.listen(port);
  
  logger.info(`🚀 CDN Service running on port ${port}`, {
    service: 'cdn-service',
    port,
    environment: process.env.NODE_ENV || 'development',
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start CDN Service:', error);
  process.exit(1);
});