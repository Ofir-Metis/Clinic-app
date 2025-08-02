/**
 * AuthModule - JWT authentication module for microservices
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from './jwt.service';
import { JwtAuthGuard, WebSocketJwtGuard, RecordingAccessGuard, AdminGuard } from './jwt.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    JwtService,
    JwtAuthGuard,
    WebSocketJwtGuard,
    RecordingAccessGuard,
    AdminGuard,
  ],
  exports: [
    JwtService,
    JwtAuthGuard,
    WebSocketJwtGuard,
    RecordingAccessGuard,
    AdminGuard,
  ],
})
export class AuthModule {}

export {
  JwtService,
  JwtAuthGuard,
  WebSocketJwtGuard,
  RecordingAccessGuard,
  AdminGuard,
};