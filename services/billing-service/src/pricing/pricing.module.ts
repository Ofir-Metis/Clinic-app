import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachPricing } from '../entities/coach-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoachPricing])],
  providers: [],
  exports: [],
})
export class PricingModule {}