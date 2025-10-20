import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Billing-Service');

  try {
    logger.log('🚀 Starting Billing Service...');

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

    // Enable CORS
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:5173'],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production'
    }));

    // Set global prefix for billing API
    app.setGlobalPrefix('api/billing');

    const port = configService.get<number>('PORT') || 3009;
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🎉 Billing Service successfully started on port ${port}`);
    logger.log(`💰 Billing API available at: http://localhost:${port}/api/billing`);
    
  } catch (error) {
    logger.error('💥 Failed to start Billing Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Billing-Service-Bootstrap');
  logger.error('🚨 Critical error during Billing Service startup:', error instanceof Error ? error.stack : String(error));
  logger.error('🔄 Exiting process for container restart...');
  process.exit(1);
});