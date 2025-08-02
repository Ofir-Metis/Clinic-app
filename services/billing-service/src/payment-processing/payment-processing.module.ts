import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymentProcessingService } from './payment-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction]), HttpModule],
  providers: [PaymentProcessingService],
  exports: [PaymentProcessingService],
})
export class PaymentProcessingModule {}