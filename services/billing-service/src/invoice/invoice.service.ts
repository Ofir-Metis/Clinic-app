import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(SubscriptionInvoice)
    private invoiceRepository: Repository<SubscriptionInvoice>,
  ) {}

  async getInvoice(invoiceId: string): Promise<SubscriptionInvoice | null> {
    return this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['subscription', 'subscription.plan'],
    });
  }

  async getCoachInvoices(coachId: string): Promise<SubscriptionInvoice[]> {
    return this.invoiceRepository.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
      relations: ['subscription', 'subscription.plan'],
    });
  }

  async markAsPaid(invoiceId: string, paymentDetails: any): Promise<void> {
    await this.invoiceRepository.update(invoiceId, {
      status: 'paid',
      paymentDate: new Date(),
      paymentMethod: paymentDetails.method,
      paymentProcessor: paymentDetails.processor,
      processorTransactionId: paymentDetails.transactionId,
    });
  }
}