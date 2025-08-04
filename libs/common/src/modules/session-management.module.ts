import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SessionManagementService } from '../services/session-management.service';
import { SessionGuard } from '../guards/session.guard';
import { SessionManagementController } from '../controllers/session-management.controller';

/**
 * Session Management Module
 * 
 * Provides comprehensive session management with healthcare-grade security:
 * - Secure session creation and validation
 * - Device fingerprinting and anomaly detection
 * - Concurrent session management
 * - Automatic session cleanup and rotation
 * - Session analytics and monitoring
 * 
 * Features:
 * - HIPAA-compliant session handling
 * - Multi-level security (standard, elevated, admin)
 * - Permission-based access control
 * - Comprehensive audit logging
 * - Automatic session rotation
 * - Device and IP tracking
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [SessionManagementModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SessionManagementService,
    SessionGuard,
    // Optionally register SessionGuard globally
    // {
    //   provide: APP_GUARD,
    //   useClass: SessionGuard,
    // },
  ],
  controllers: [SessionManagementController],
  exports: [
    SessionManagementService,
    SessionGuard,
  ],
})
export class SessionManagementModule {}