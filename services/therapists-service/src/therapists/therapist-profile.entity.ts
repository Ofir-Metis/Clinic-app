import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsUUID, IsArray, IsOptional, Length, IsEmail, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Therapist specialization areas enum
 */
export enum TherapistSpecialization {
  LIFE_COACHING = 'life_coaching',
  CAREER_COACHING = 'career_coaching',
  WELLNESS_COACHING = 'wellness_coaching',
  BUSINESS_COACHING = 'business_coaching',
  RELATIONSHIP_COACHING = 'relationship_coaching',
  PERSONAL_DEVELOPMENT = 'personal_development',
  MINDFULNESS = 'mindfulness',
  STRESS_MANAGEMENT = 'stress_management'
}

/**
 * TherapistProfile entity for coach/therapist public information
 * Enterprise-grade entity with validation, indexing, and security features
 */
@Entity('therapist_profiles')
@Index(['userId'], { unique: true })
@Index(['isActive'])
@Index(['specializations'])
export class TherapistProfile {
  @ApiProperty({ description: 'Unique profile identifier' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Associated user ID' })
  @Column({ type: 'uuid', unique: true })
  @IsUUID(4)
  userId!: string;

  @ApiProperty({ description: 'Therapist full name', maxLength: 200 })
  @Column({ type: 'varchar', length: 200 })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ description: 'Professional title', maxLength: 150 })
  @Column({ type: 'varchar', length: 150 })
  @IsString()
  @Length(1, 150)
  title!: string;

  @ApiProperty({ description: 'Professional biography', maxLength: 2000 })
  @Column({ type: 'text' })
  @IsString()
  @Length(50, 2000)
  bio!: string;

  @ApiPropertyOptional({ description: 'Professional email for contact' })
  @Column({ type: 'varchar', length: 320, nullable: true })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Professional phone number' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Professional website URL' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Specialization areas' })
  @Column({ 
    type: 'enum',
    enum: TherapistSpecialization,
    array: true,
    default: '{}'
  })
  @IsArray()
  @IsEnum(TherapistSpecialization, { each: true })
  specializations!: TherapistSpecialization[];

  @ApiPropertyOptional({ description: 'Years of experience' })
  @Column({ type: 'integer', nullable: true, default: 0 })
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Professional certifications and credentials' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  @IsOptional()
  @IsArray()
  certifications?: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
  }[];

  @ApiPropertyOptional({ description: 'Languages spoken' })
  @Column({ type: 'varchar', array: true, default: '{}' })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Available time zones' })
  @Column({ type: 'varchar', array: true, default: '{}' })
  @IsOptional()
  @IsArray()
  timeZones?: string[];

  @ApiPropertyOptional({ description: 'Session rates and pricing' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  pricing?: {
    individualSession: number;
    groupSession?: number;
    packageDeals?: {
      sessions: number;
      price: number;
      description: string;
    }[];
    currency: string;
  };

  @ApiPropertyOptional({ description: 'Professional media and portfolio' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  @IsOptional()
  @IsArray()
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
    isPublic: boolean;
  }[];

  @ApiPropertyOptional({ description: 'Client testimonials' })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  @IsOptional()
  @IsArray()
  @Exclude({ toPlainOnly: true }) // Exclude from public API for privacy
  testimonials?: {
    content: string;
    clientInitials: string;
    date: Date;
    rating: number;
    approved: boolean;
  }[];

  @ApiPropertyOptional({ description: 'Profile visibility settings' })
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Public profile visibility' })
  @Column({ type: 'boolean', default: true })
  isPublic!: boolean;

  @ApiPropertyOptional({ description: 'Accepting new clients' })
  @Column({ type: 'boolean', default: true })
  acceptingNewClients!: boolean;

  @ApiProperty({ description: 'Profile creation timestamp' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ApiProperty({ description: 'Profile last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Profile verification status' })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @Exclude({ toPlainOnly: true })
  verification?: {
    isVerified: boolean;
    verificationDate?: Date;
    verificationLevel: 'basic' | 'professional' | 'premium';
    verifiedBy?: string;
  };

  /**
   * Get public-safe profile data
   */
  toPublicProfile() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      bio: this.bio,
      specializations: this.specializations,
      yearsOfExperience: this.yearsOfExperience,
      languages: this.languages,
      timeZones: this.timeZones,
      isAcceptingNewClients: this.acceptingNewClients,
      media: this.media?.filter(m => m.isPublic),
      verification: this.verification?.isVerified ? {
        isVerified: true,
        verificationLevel: this.verification.verificationLevel
      } : { isVerified: false }
    };
  }
}
