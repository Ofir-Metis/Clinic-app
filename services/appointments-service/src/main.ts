import { LoggingInterceptor } from './logging.interceptor';
import { AllExceptionsFilter } from './http-exception.filter';
import { LoggingMiddleware } from './logging.middleware';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new LoggingMiddleware().use);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
