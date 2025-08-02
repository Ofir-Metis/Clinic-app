import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ClientPaymentModule } from './client-payment/client-payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PricingModule } from './pricing/pricing.module';
import { TaxComplianceModule } from './tax-compliance/tax-compliance.module';
import { PaymentProcessingModule } from './payment-processing/payment-processing.module';
import { ReportingModule } from './reporting/reporting.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB_BILLING) || 1,
      },
    }),
    
    ScheduleModule.forRoot(),
    
    DatabaseModule,
    SubscriptionModule,
    ClientPaymentModule,
    InvoiceModule,
    PricingModule,
    TaxComplianceModule,
    PaymentProcessingModule,
    ReportingModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class AppModule {}