import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PaymentType = 'session' | 'package' | 'subscription';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash';

@Entity('client_therapist_payments')
export class ClientCoachPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'uuid', name: 'therapist_id' })
  coachId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'appointment_id' })
  appointmentId!: string;

  // Payment Details
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_nis' })
  amountNis!: number;

  @Column({ type: 'varchar', length: 3, default: 'ILS' })
  currency!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'payment_type',
    enum: ['session', 'package', 'subscription']
  })
  paymentType!: PaymentType;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Platform Commission
  @Column({ type: 'decimal', precision: 5, scale: 4, name: 'platform_commission_rate' })
  platformCommissionRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'platform_commission_nis' })
  platformCommissionNis!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'therapist_payout_nis' })
  therapistPayoutNis!: number;

  // Payment Processing
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    enum: ['pending', 'completed', 'failed', 'refunded']
  })
  status!: PaymentStatus;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
    enum: ['credit_card', 'bank_transfer', 'cash']
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_processor' })
  paymentProcessor!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'processor_transaction_id' })
  processorTransactionId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'processor_fee_nis' })
  processorFeeNis!: number;

  // Israeli Compliance
  @Column({ type: 'boolean', default: true, name: 'requires_receipt' })
  requiresReceipt!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'receipt_number' })
  receiptNumber!: string;

  @Column({ type: 'boolean', default: true, name: 'vat_included' })
  vatIncluded!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.18, name: 'vat_rate' })
  vatRate!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'payment_date' })
  paymentDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}