import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from '@clinic/common';
import { AllExceptionsFilter } from '@clinic/common';
import { LoggingMiddleware } from '@clinic/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new LoggingMiddleware().use);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
