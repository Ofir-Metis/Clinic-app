import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CoachSubscription } from '../entities/coach-subscription.entity';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, CoachSubscription, SubscriptionInvoice])],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}