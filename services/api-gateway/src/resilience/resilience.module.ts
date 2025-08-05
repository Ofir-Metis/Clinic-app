import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResilienceService } from './resilience.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { TimeoutService } from './timeout.service';
import { BulkheadService } from './bulkhead.service';
import { ResilienceController } from './resilience.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    CircuitBreakerService,
    RetryService,
    TimeoutService,
    BulkheadService,
    ResilienceService,
  ],
  controllers: [ResilienceController],
  exports: [
    ResilienceService,
    CircuitBreakerService,
    RetryService,
    TimeoutService,
    BulkheadService,
  ],
})
export class ResilienceModule {}