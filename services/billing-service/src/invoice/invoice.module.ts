import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionInvoice])],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}