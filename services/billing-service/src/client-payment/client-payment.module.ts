import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientTherapistPayment } from '../entities/client-therapist-payment.entity';
import { TherapistPricing } from '../entities/therapist-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientTherapistPayment, TherapistPricing])],
  providers: [],
  exports: [],
})
export class ClientPaymentModule {}