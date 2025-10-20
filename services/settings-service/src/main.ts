import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor, LoggingMiddleware, AllExceptionsFilter, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Settings-Service');

  try {
    logger.log('🚀 Starting Settings Service...');

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
      // app.use(new LoggingMiddleware(loggerService).use); // Temporarily disabled for production stability
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
      .setTitle('Settings Service API')
      .setDescription('User preferences and system configuration service')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Settings', 'User and system settings management')
      .addTag('Health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3008;
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🎉 Settings Service successfully started on port ${port}`);
    logger.log(`📚 API documentation: http://localhost:${port}/api/docs`);
    logger.log(`⚙️ Ready to manage user preferences and system settings`);
    
  } catch (error) {
    logger.error('💥 Failed to start Settings Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Settings-Service-Bootstrap');
  logger.error('🚨 Critical error during Settings Service startup:', error instanceof Error ? error.stack : String(error));
  logger.error('🔄 Exiting process for container restart...');
  process.exit(1);
});
