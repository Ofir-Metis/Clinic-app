import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StructuredLoggerService } from '@clinic/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Setup structured logging
  const logger = app.get(StructuredLoggerService);
  app.useLogger(logger);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Healthcare Platform Search Service')
      .setDescription('Advanced search capabilities with Elasticsearch')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('search', 'Search operations')
      .addTag('indexing', 'Content indexing operations')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // NATS microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://localhost:4222'],
      queue: 'search-service',
    },
  });

  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3010;
  await app.listen(port);
  
  logger.info(`🔍 Search Service running on port ${port}`, {
    service: 'search-service',
    port,
    environment: process.env.NODE_ENV || 'development',
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start Search Service:', error);
  process.exit(1);
});