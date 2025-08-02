import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapistPricing } from '../entities/therapist-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TherapistPricing])],
  providers: [],
  exports: [],
})
export class PricingModule {}