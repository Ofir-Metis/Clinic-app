import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, LoggingMiddleware, CentralizedLoggerService } from '@clinic/common';

async function bootstrap() {
  const logger = new Logger('Analytics-Service');

  try {
    logger.log('🚀 Starting Analytics Service...');

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

    const port = process.env.PORT || 3007;
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🎉 Analytics Service successfully started on port ${port}`);
    
  } catch (error) {
    logger.error('💥 Failed to start Analytics Service:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Analytics-Service-Bootstrap');
  logger.error('🚨 Critical error during Analytics Service startup:', error instanceof Error ? error.stack : String(error));
  logger.error('🔄 Exiting process for container restart...');
  process.exit(1);
});
