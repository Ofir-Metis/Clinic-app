import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CoachSubscription } from '../entities/coach-subscription.entity';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { ClientTherapistPayment } from '../entities/client-therapist-payment.entity';
import { TherapistPricing } from '../entities/therapist-pricing.entity';
import { TaxComplianceRecord } from '../entities/tax-compliance-record.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'clinic_billing'),
        entities: [
          SubscriptionPlan,
          CoachSubscription,
          SubscriptionInvoice,
          ClientTherapistPayment,
          TherapistPricing,
          TaxComplianceRecord,
          PaymentTransaction,
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}