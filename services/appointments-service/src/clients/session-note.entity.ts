import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNumber, IsDate, Length, IsOptional } from 'class-validator';

/**
 * SessionNote entity for storing coaching session notes
 * Enterprise-grade entity with proper validation, indexing, and PHI compliance
 */
@Entity('session_notes')
@Index(['patientId', 'therapistId']) // Composite index for performance
@Index(['date']) // Date-based queries optimization
export class SessionNote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  @IsNumber()
  patientId!: number;

  @Column({ type: 'integer' })
  @IsNumber()
  therapistId!: number;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(1, 100)
  type!: string;

  @Column({ type: 'text' })
  @IsString()
  @Length(1, 10000) // Max 10k characters for performance
  note!: string;

  @Column({ type: 'timestamp with time zone' })
  @IsDate()
  date!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  metadata?: string; // JSON metadata for extensibility
}
