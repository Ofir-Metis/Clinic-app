import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsString, IsBoolean, IsOptional, Length, IsPhoneNumber } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Client entity representing a client in the coaching platform.
 * Enterprise-grade entity with PHI compliance, validation, and security features.
 * Note: This is for coaching clients, not medical clients.
 */
@Entity('clients')
@Index(['email'], { unique: true })
@Index(['therapistId'])
@Index(['createdAt'])
export class Client {
  @ApiProperty({ description: 'Unique client identifier' })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ description: 'Client first name', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @ApiProperty({ description: 'Client last name', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @ApiProperty({ description: 'Client email address', maxLength: 320 })
  @Column({ type: 'varchar', length: 320, unique: true })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email!: string;

  @ApiPropertyOptional({ description: 'Client phone number', maxLength: 20 })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  @Transform(({ value }) => value?.replace(/\D/g, '') || null)
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp communication consent' })
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  whatsappOptIn!: boolean;

  @ApiProperty({ description: 'Assigned therapist/coach ID' })
  @Column({ type: 'integer' })
  therapistId!: number;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  @ApiPropertyOptional({ description: 'Client preferences and settings' })
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  @IsOptional()
  preferences?: {
    communicationMethod: 'email' | 'sms' | 'whatsapp';
    timezone: string;
    language: string;
    sessionReminders: boolean;
    marketingConsent: boolean;
  };

  @ApiPropertyOptional({ description: 'GDPR consent and compliance tracking' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @Exclude({ toPlainOnly: true }) // Exclude from API responses for privacy
  gdprConsent?: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    consentDate: Date;
    ipAddress: string;
    userAgent: string;
  };

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp for GDPR compliance' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  @Exclude({ toPlainOnly: true })
  deletedAt?: Date;

  /**
   * Virtual property for full name
   */
  @ApiProperty({ description: 'Client full name (computed)' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if client record is active (not soft deleted)
   */
  get isActive(): boolean {
    return !this.deletedAt;
  }
}
