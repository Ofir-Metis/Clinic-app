import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNumber, IsEnum, IsDate, Min, IsOptional } from 'class-validator';
import { Exclude } from 'class-transformer';

/**
 * Invoice entity for billing management
 * Enterprise-grade entity with proper validation, audit trail, and financial compliance
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

@Entity('invoices')
@Index(['patientId', 'status']) // Query optimization
@Index(['issuedAt']) // Date-based queries
@Index(['status', 'issuedAt']) // Status and date composite
export class Invoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', name: 'patient_id' })
  @IsString()
  patientId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  @IsString()
  currency!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT
  })
  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'timestamp with time zone' })
  @IsDate()
  issuedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  @IsDate()
  paidAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @Exclude() // Exclude sensitive payment details from serialization
  paymentDetails?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  invoiceNumber?: string; // Human-readable invoice number
}
