import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppSimpleModule } from './app-simple.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppSimpleModule);
    
    // Enable CORS
    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    });
    
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🚀 Simple API Gateway running on port ${port}`);
    logger.log(`🎯 Available endpoints:`);
    logger.log(`   GET  /health - Health check`);
    logger.log(`   GET  /status - System status`);
    logger.log(`   ALL  /api/* - Proxy to microservices`);
    
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

bootstrap();