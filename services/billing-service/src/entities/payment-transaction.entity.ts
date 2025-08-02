import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TransactionEntityType = 'subscription' | 'client_payment';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    name: 'entity_type',
    enum: ['subscription', 'client_payment']
  })
  entityType: TransactionEntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  // Transaction Details
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_nis' })
  amountNis: number;

  @Column({ type: 'varchar', length: 3, default: 'ILS' })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  processor: string; // tranzilla, cardcom, isracard, stripe

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'processor_transaction_id' })
  processorTransactionId: string;

  // Status Tracking
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;

  // Processing Details
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'processing_fee_nis' })
  processingFeeNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'net_amount_nis' })
  netAmountNis: number;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'settled_at' })
  settledAt: Date;

  // Security
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_method_token' })
  paymentMethodToken: string; // tokenized payment method

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'fraud_score' })
  fraudScore: number;

  @Column({ type: 'jsonb', nullable: true, name: 'risk_assessment' })
  riskAssessment: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}