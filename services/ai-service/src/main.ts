import { LoggingInterceptor, AllExceptionsFilter, LoggingMiddleware } from '@clinic/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AI-Service');

  // Create HTTP application
  const app = await NestFactory.create(AppModule);

  // Global middleware and filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new LoggingMiddleware().use);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

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
  await app.listen(port);
  logger.log(`AI Service running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start AI service:', error);
  process.exit(1);
});
