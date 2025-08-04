import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CentralizedLoggerService } from './centralized-logger.service';
import { LoggingInterceptor } from './logging.interceptor';
import { LoggingMiddleware } from './logging.middleware';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    CentralizedLoggerService,
    LoggingInterceptor,
    LoggingMiddleware
  ],
  exports: [
    CentralizedLoggerService,
    LoggingInterceptor,
    LoggingMiddleware
  ]
})
export class LoggingModule {}