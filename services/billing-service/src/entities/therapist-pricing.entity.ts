import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('therapist_pricing')
export class TherapistPricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'therapist_id' })
  therapistId: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_id' })
  clientId: string; // null for default pricing

  // Pricing Structure
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'session_price_nis' })
  sessionPriceNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'package_4_price_nis' })
  package4PriceNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'package_8_price_nis' })
  package8PriceNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'package_12_price_nis' })
  package12PriceNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_subscription_nis' })
  monthlySubscriptionNis: number;

  // Special Conditions
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percentage' })
  discountPercentage: number;

  @Column({ type: 'integer', default: 24, name: 'minimum_notice_hours' })
  minimumNoticeHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cancellation_fee_nis' })
  cancellationFeeNis: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'date', name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true, name: 'effective_until' })
  effectiveUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}