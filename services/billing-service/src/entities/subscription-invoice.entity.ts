import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CoachSubscription } from './coach-subscription.entity';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type CTCSubmissionStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

@Entity('subscription_invoices')
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId!: string;

  @Column({ type: 'uuid', name: 'coach_id' })
  coachId!: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({ type: 'date', name: 'due_date' })
  dueDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal_nis' })
  subtotalNis!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'vat_amount_nis' })
  vatAmountNis!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount_nis' })
  totalAmountNis!: number;

  @Column({ type: 'varchar', length: 3, default: 'ILS' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    enum: ['pending', 'paid', 'overdue', 'cancelled']
  })
  status!: InvoiceStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'payment_date' })
  paymentDate!: Date;

  // Israeli Compliance Fields
  @Column({ type: 'boolean', default: false, name: 'requires_ctc' })
  requiresCTC!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'ctc_allocation_number' })
  ctcAllocationNumber!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'ctc_submission_status',
    enum: ['pending', 'submitted', 'approved', 'rejected']
  })
  ctcSubmissionStatus!: CTCSubmissionStatus;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.18, name: 'vat_rate' })
  vatRate!: number;

  // Payment Processing Fields
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_processor' })
  paymentProcessor!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'processor_transaction_id' })
  processorTransactionId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'processor_fee_nis' })
  processorFeeNis!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => CoachSubscription, subscription => subscription.invoices)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: CoachSubscription;
}