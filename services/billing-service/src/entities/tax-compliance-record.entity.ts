import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type EntityType = 'subscription_invoice' | 'client_payment' | 'therapist_payout';
export type ComplianceStatus = 'pending' | 'compliant' | 'non_compliant' | 'under_review';

@Entity('tax_compliance_records')
export class TaxComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'entity_type',
    enum: ['subscription_invoice', 'client_payment', 'therapist_payout']
  })
  entityType!: EntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId!: string;

  // CTC Information
  @Column({ type: 'boolean', name: 'requires_ctc' })
  requiresCTC!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 20000, name: 'ctc_threshold_nis' })
  ctcThresholdNis!: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'allocation_number' })
  allocationNumber!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'submission_timestamp' })
  submissionTimestamp!: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'ita_response' })
  itaResponse!: Record<string, any>;

  // VAT Information
  @Column({ type: 'decimal', precision: 5, scale: 4, name: 'vat_rate' })
  vatRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'vat_amount_nis' })
  vatAmountNis!: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'vat_exemption_reason' })
  vatExemptionReason!: string;

  // Audit Trail
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    name: 'compliance_status',
    enum: ['pending', 'compliant', 'non_compliant', 'under_review']
  })
  complianceStatus!: ComplianceStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'last_verification_date' })
  lastVerificationDate!: Date;

  @Column({ type: 'text', nullable: true, name: 'verification_notes' })
  verificationNotes!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}