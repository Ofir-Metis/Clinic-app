import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityHeadersService } from '../services/security-headers.service';
import { SecurityHeadersController } from '../controllers/security-headers.controller';
import { SecurityHeadersMiddleware } from '../middleware/security-headers.middleware';

/**
 * Security Headers Module
 * 
 * Provides comprehensive security headers implementation including:
 * - SecurityHeadersMiddleware for automatic header injection
 * - SecurityHeadersService for header generation and analysis
 * - SecurityHeadersController for management endpoints
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [SecurityHeadersModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SecurityHeadersService,
    SecurityHeadersMiddleware,
  ],
  controllers: [SecurityHeadersController],
  exports: [
    SecurityHeadersService,
    SecurityHeadersMiddleware,
  ],
})
export class SecurityHeadersModule {}