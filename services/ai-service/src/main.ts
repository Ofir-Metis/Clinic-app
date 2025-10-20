import { LoggingInterceptor, AllExceptionsFilter, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AI-Service');

  try {
    logger.log('🚀 Starting AI Service...');

    // Create HTTP application
    const app = await NestFactory.create(AppModule);

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
    app.useGlobalPipes(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production'
    }));

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('AI Service API')
    .setDescription('Coaching session transcription and AI analysis service')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Session Analysis', 'AI-powered coaching session analysis')
    .addTag('Health', 'Service health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Connect NATS microservice
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsUrl],
      queue: 'ai-service-queue',
      maxReconnectAttempts: 10,
      reconnectTimeWait: 2000,
    },
  });

  // Start microservices
  await app.startAllMicroservices();
  logger.log(`NATS microservice connected to ${natsUrl}`);

    // Start HTTP server
    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🎉 AI Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/api/docs`);
    logger.log(`🔗 NATS connected to: ${natsUrl}`);
    
  } catch (error) {
    logger.error('💥 Failed to start AI Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('AI-Service-Bootstrap');
  logger.error('🚨 Critical error during AI Service startup:', error instanceof Error ? error.stack : String(error));
  logger.error('🔄 Exiting process for container restart...');
  process.exit(1);
});
