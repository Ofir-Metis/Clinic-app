import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CoachSubscription } from './coach-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_monthly_nis' })
  priceMonthlyNis: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_monthly_usd' })
  priceMonthlyUsd: number;

  @Column({ type: 'jsonb' })
  features: Record<string, any>;

  @Column({ type: 'integer', name: 'max_clients', nullable: true })
  maxClients: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CoachSubscription, subscription => subscription.plan)
  subscriptions: CoachSubscription[];
}