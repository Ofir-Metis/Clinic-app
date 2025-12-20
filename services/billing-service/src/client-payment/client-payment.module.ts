import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientCoachPayment } from '../entities/client-coach-payment.entity';
import { CoachPricing } from '../entities/coach-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientCoachPayment, CoachPricing])],
  providers: [],
  exports: [],
})
export class ClientPaymentModule {}