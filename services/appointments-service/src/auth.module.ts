import { Global, Module } from '@nestjs/common';
import { MockJwtService } from './mock-jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Global auth module - makes MockJwtService and JwtAuthGuard
 * available to all modules without explicit imports.
 */
@Global()
@Module({
  providers: [MockJwtService, JwtAuthGuard],
  exports: [MockJwtService, JwtAuthGuard],
})
export class AuthModule {}
