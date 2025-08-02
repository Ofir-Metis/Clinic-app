import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
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
  }));

  // Set global prefix
  app.setGlobalPrefix('api/billing');

  const port = configService.get<number>('PORT') || 3009;
  await app.listen(port);
  
  console.log(`🚀 Billing Service running on port ${port}`);
}

bootstrap();