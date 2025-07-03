import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '../../auth-service/src/http-exception.filter';
import { LoggingMiddleware } from '../../auth-service/src/logging.middleware';
import { LoggingInterceptor } from '../../auth-service/src/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new LoggingMiddleware().use);
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
