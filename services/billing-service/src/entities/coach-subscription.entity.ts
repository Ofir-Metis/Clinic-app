import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionInvoice } from './subscription-invoice.entity';

export type SubscriptionStatus = 'active' | 'cancelled' | 'suspended' | 'past_due';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

@Entity('coach_subscriptions')
export class CoachSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'coach_id' })
  coachId!: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'active',
    enum: ['active', 'cancelled', 'suspended', 'past_due']
  })
  status!: SubscriptionStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'monthly',
    name: 'billing_cycle',
    enum: ['monthly', 'quarterly', 'annual']
  })
  billingCycle!: BillingCycle;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'date', name: 'next_billing_date' })
  nextBillingDate!: Date;

  @Column({ type: 'varchar', length: 3, default: 'ILS' })
  currency!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percentage' })
  discountPercentage!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan!: SubscriptionPlan;

  @OneToMany(() => SubscriptionInvoice, invoice => invoice.subscription)
  invoices!: SubscriptionInvoice[];
}