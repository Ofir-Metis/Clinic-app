/**
 * Proxy Module - Enterprise-grade microservice proxy
 * Routes requests to appropriate backend services
 */

import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}