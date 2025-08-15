import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CoachSubscription } from '../entities/coach-subscription.entity';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { SubscriptionService } from './subscription.service';
import { TaxComplianceModule } from '../tax-compliance/tax-compliance.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { PaymentProcessingModule } from '../payment-processing/payment-processing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, CoachSubscription, SubscriptionInvoice]),
    TaxComplianceModule,
    InvoiceModule,
    PaymentProcessingModule,
  ],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}