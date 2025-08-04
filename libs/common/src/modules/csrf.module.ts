import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '../guards/csrf.guard';
import { CsrfTokenService } from '../services/csrf-token.service';
import { CsrfController } from '../controllers/csrf.controller';

/**
 * CSRF Protection Module
 * 
 * Provides comprehensive CSRF protection including:
 * - CSRF token generation and validation
 * - Global CSRF guard registration
 * - CSRF management endpoints
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [CsrfModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [
    CsrfTokenService,
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  controllers: [CsrfController],
  exports: [CsrfTokenService],
})
export class CsrfModule {}