import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { CoachSubscription, SubscriptionStatus, BillingCycle } from '../entities/coach-subscription.entity';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { TaxComplianceService } from '../tax-compliance/tax-compliance.service';
import { InvoiceService } from '../invoice/invoice.service';
import { PaymentProcessingService } from '../payment-processing/payment-processing.service';
import Decimal from 'decimal.js';

interface CreateSubscriptionDto {
  coachId: string;
  planId: string;
  billingCycle: BillingCycle;
  discountPercentage?: number;
  startDate?: Date;
}

interface SubscriptionMetrics {
  totalActiveSubscriptions: number;
  totalMonthlyRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  planDistribution: Record<string, number>;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly VAT_RATE = 0.18; // 18% VAT for Israel (2025)
  private readonly CTC_THRESHOLD_NIS = 20000; // Current CTC threshold

  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(CoachSubscription)
    private subscriptionRepository: Repository<CoachSubscription>,
    @InjectRepository(SubscriptionInvoice)
    private invoiceRepository: Repository<SubscriptionInvoice>,
    private taxComplianceService: TaxComplianceService,
    private invoiceService: InvoiceService,
    private paymentProcessingService: PaymentProcessingService,
  ) {}

  /**
   * Create a new subscription for a coach
   */
  async createSubscription(createDto: CreateSubscriptionDto): Promise<CoachSubscription> {
    const plan = await this.planRepository.findOne({
      where: { id: createDto.planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found or inactive');
    }

    // Check for existing active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { 
        coachId: createDto.coachId, 
        status: 'active' 
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Coach already has an active subscription');
    }

    const startDate = createDto.startDate || new Date();
    const nextBillingDate = this.calculateNextBillingDate(startDate, createDto.billingCycle);

    const subscription = this.subscriptionRepository.create({
      coachId: createDto.coachId,
      planId: createDto.planId,
      billingCycle: createDto.billingCycle,
      status: 'active',
      startDate,
      nextBillingDate,
      discountPercentage: createDto.discountPercentage || 0,
      currency: 'ILS',
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Generate first invoice
    await this.generateInvoiceForSubscription(savedSubscription.id);

    this.logger.log(`Created subscription ${savedSubscription.id} for coach ${createDto.coachId}`);
    return savedSubscription;
  }

  /**
   * Generate invoice for a subscription with Israeli compliance
   */
  async generateInvoiceForSubscription(subscriptionId: string): Promise<SubscriptionInvoice> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Calculate amounts with Israeli VAT
    const baseAmount = this.getSubscriptionAmount(subscription);
    const discountAmount = new Decimal(baseAmount).mul(subscription.discountPercentage).div(100);
    const subtotal = new Decimal(baseAmount).minus(discountAmount);
    const vatAmount = subtotal.mul(this.VAT_RATE);
    const totalAmount = subtotal.plus(vatAmount);

    // Check if CTC is required
    const requiresCTC = totalAmount.greaterThan(this.CTC_THRESHOLD_NIS);

    const invoice = this.invoiceRepository.create({
      subscriptionId: subscription.id,
      coachId: subscription.coachId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotalNis: subtotal.toNumber(),
      vatAmountNis: vatAmount.toNumber(),
      totalAmountNis: totalAmount.toNumber(),
      currency: 'ILS',
      status: 'pending',
      requiresCTC,
      vatRate: this.VAT_RATE,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Handle CTC compliance if required
    if (requiresCTC) {
      try {
        const allocationNumber = await this.taxComplianceService.submitForCTCClearance({
          invoiceId: savedInvoice.id,
          invoiceNumber: savedInvoice.invoiceNumber,
          amount: totalAmount.toNumber(),
          vatAmount: vatAmount.toNumber(),
          customerType: 'business',
          businessId: subscription.coachId,
        });

        savedInvoice.ctcAllocationNumber = allocationNumber;
        savedInvoice.ctcSubmissionStatus = 'approved';
        await this.invoiceRepository.save(savedInvoice);

        this.logger.log(`CTC approval received for invoice ${invoiceNumber}: ${allocationNumber}`);
      } catch (error) {
        this.logger.error(`CTC submission failed for invoice ${invoiceNumber}:`, error);
        savedInvoice.ctcSubmissionStatus = 'rejected';
        await this.invoiceRepository.save(savedInvoice);
      }
    }

    // Create tax compliance record
    await this.taxComplianceService.createComplianceRecord({
      entityType: 'subscription_invoice',
      entityId: savedInvoice.id,
      requiresCTC,
      vatRate: this.VAT_RATE,
      vatAmount: vatAmount.toNumber(),
      allocationNumber: savedInvoice.ctcAllocationNumber,
    });

    this.logger.log(`Generated invoice ${invoiceNumber} for subscription ${subscriptionId}`);
    return savedInvoice;
  }

  /**
   * Process subscription billing (run daily)
   */
  @Cron('0 2 * * *') // Run at 2 AM daily
  async processPendingBilling(): Promise<void> {
    this.logger.log('Starting daily subscription billing process');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptionsToBill = await this.subscriptionRepository.find({
      where: {
        status: 'active',
        nextBillingDate: today,
      },
      relations: ['plan'],
    });

    this.logger.log(`Found ${subscriptionsToBill.length} subscriptions to bill`);

    for (const subscription of subscriptionsToBill) {
      try {
        await this.billSubscription(subscription);
      } catch (error) {
        this.logger.error(`Failed to bill subscription ${subscription.id}:`, error);
        
        // Mark subscription as past due after 3 failed attempts
        await this.handleFailedBilling(subscription);
      }
    }

    this.logger.log('Completed daily subscription billing process');
  }

  /**
   * Bill a specific subscription
   */
  private async billSubscription(subscription: CoachSubscription): Promise<void> {
    // Generate invoice
    const invoice = await this.generateInvoiceForSubscription(subscription.id);

    // Process payment
    try {
      const paymentResult = await this.paymentProcessingService.processSubscriptionPayment({
        invoiceId: invoice.id,
        amount: invoice.totalAmountNis,
        currency: 'ILS',
        customerId: subscription.coachId,
        description: `Subscription payment for ${subscription.plan.name}`,
      });

      if (paymentResult.success) {
        // Update invoice as paid
        invoice.status = 'paid';
        invoice.paymentDate = new Date();
        invoice.paymentProcessor = paymentResult.processor;
        invoice.processorTransactionId = paymentResult.transactionId;
        invoice.processorFeeNis = paymentResult.processingFee;
        await this.invoiceRepository.save(invoice);

        // Update next billing date
        subscription.nextBillingDate = this.calculateNextBillingDate(
          subscription.nextBillingDate,
          subscription.billingCycle
        );
        await this.subscriptionRepository.save(subscription);

        this.logger.log(`Successfully billed subscription ${subscription.id}`);
      } else {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }
    } catch (error) {
      this.logger.error(`Payment processing failed for subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed billing attempts
   */
  private async handleFailedBilling(subscription: CoachSubscription): Promise<void> {
    // In a real implementation, you'd track failed attempts
    // For now, mark as past due and schedule retry
    
    subscription.status = 'past_due';
    await this.subscriptionRepository.save(subscription);

    // Schedule retry in 3 days
    const retryDate = new Date();
    retryDate.setDate(retryDate.getDate() + 3);
    subscription.nextBillingDate = retryDate;
    await this.subscriptionRepository.save(subscription);

    this.logger.warn(`Marked subscription ${subscription.id} as past due, retry scheduled for ${retryDate}`);
  }

  /**
   * Calculate next billing date based on cycle
   */
  private calculateNextBillingDate(currentDate: Date, billingCycle: BillingCycle): Date {
    const nextDate = new Date(currentDate);

    switch (billingCycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Get subscription amount based on plan and billing cycle
   */
  private getSubscriptionAmount(subscription: CoachSubscription): number {
    const monthlyPrice = subscription.plan.priceMonthlyNis;

    switch (subscription.billingCycle) {
      case 'monthly':
        return monthlyPrice;
      case 'quarterly':
        return monthlyPrice * 3 * 0.95; // 5% discount
      case 'annual':
        return monthlyPrice * 12 * 0.90; // 10% discount
      default:
        return monthlyPrice;
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await this.invoiceRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber.startsWith(`INV-${year}${month}`)) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * Get subscription metrics for admin dashboard
   */
  async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    const [
      totalActive,
      allSubscriptions,
      revenueData,
      planDistribution,
    ] = await Promise.all([
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.subscriptionRepository.find({ relations: ['plan'] }),
      this.calculateMonthlyRecurringRevenue(),
      this.getPlanDistribution(),
    ]);

    const churnRate = await this.calculateChurnRate();
    const arpu = totalActive > 0 ? revenueData / totalActive : 0;

    return {
      totalActiveSubscriptions: totalActive,
      totalMonthlyRecurringRevenue: revenueData,
      churnRate,
      averageRevenuePerUser: arpu,
      planDistribution,
    };
  }

  /**
   * Calculate monthly recurring revenue
   */
  private async calculateMonthlyRecurringRevenue(): Promise<number> {
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: 'active' },
      relations: ['plan'],
    });

    let totalMRR = 0;
    for (const subscription of activeSubscriptions) {
      const monthlyAmount = this.getMonthlyEquivalent(subscription);
      totalMRR += monthlyAmount;
    }

    return totalMRR;
  }

  /**
   * Get monthly equivalent amount for any billing cycle
   */
  private getMonthlyEquivalent(subscription: CoachSubscription): number {
    const baseAmount = subscription.plan.priceMonthlyNis;
    const discountMultiplier = 1 - (subscription.discountPercentage / 100);

    switch (subscription.billingCycle) {
      case 'monthly':
        return baseAmount * discountMultiplier;
      case 'quarterly':
        return (baseAmount * 3 * 0.95 * discountMultiplier) / 3;
      case 'annual':
        return (baseAmount * 12 * 0.90 * discountMultiplier) / 12;
      default:
        return baseAmount * discountMultiplier;
    }
  }

  /**
   * Calculate churn rate (percentage of cancellations in last month)
   */
  private async calculateChurnRate(): Promise<number> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [totalAtStartOfMonth, cancelledInMonth] = await Promise.all([
      this.subscriptionRepository.count({
        where: {
          createdAt: { $lte: lastMonth } as any,
        },
      }),
      this.subscriptionRepository.count({
        where: {
          status: 'cancelled',
          updatedAt: { $gte: lastMonth } as any,
        },
      }),
    ]);

    return totalAtStartOfMonth > 0 ? (cancelledInMonth / totalAtStartOfMonth) * 100 : 0;
  }

  /**
   * Get plan distribution
   */
  private async getPlanDistribution(): Promise<Record<string, number>> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: 'active' },
      relations: ['plan'],
    });

    const distribution: Record<string, number> = {};
    for (const subscription of subscriptions) {
      const planName = subscription.plan.name;
      distribution[planName] = (distribution[planName] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await this.subscriptionRepository.save(subscription);

    this.logger.log(`Cancelled subscription ${subscriptionId}. Reason: ${reason || 'Not specified'}`);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<CoachSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'invoices'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Get coach's active subscription
   */
  async getCoachSubscription(coachId: string): Promise<CoachSubscription | null> {
    return this.subscriptionRepository.findOne({
      where: { coachId, status: 'active' },
      relations: ['plan'],
    });
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { priceMonthlyNis: 'ASC' },
    });
  }
}