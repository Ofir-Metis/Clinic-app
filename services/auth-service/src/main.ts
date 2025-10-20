import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from '@clinic/common';
import { AllExceptionsFilter } from '@clinic/common';
import { LoggingMiddleware } from '@clinic/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Temporary: Disable logging middleware to prevent crashes
  // app.useGlobalInterceptors(new LoggingInterceptor({} as any));
  app.useGlobalFilters(new AllExceptionsFilter());
  // app.use(new LoggingMiddleware({} as any).use);
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
