import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CoachSubscription } from '../entities/coach-subscription.entity';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { ClientTherapistPayment } from '../entities/client-therapist-payment.entity';
import { TherapistPricing } from '../entities/therapist-pricing.entity';
import { TaxComplianceRecord } from '../entities/tax-compliance-record.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

/**
 * Database Module for Billing Service
 * 
 * Uses the shared database connection from CommonModule's EnterpriseDatabaseModule
 * and registers billing-specific entities via TypeOrmModule.forFeature()
 */
@Module({
  imports: [
    // Use the shared database connection from CommonModule
    // Remove duplicate TypeOrmModule.forRootAsync to prevent connection pool conflicts
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      CoachSubscription,
      SubscriptionInvoice,
      ClientTherapistPayment,
      TherapistPricing,
      TaxComplianceRecord,
      PaymentTransaction,
    ]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class DatabaseModule {}