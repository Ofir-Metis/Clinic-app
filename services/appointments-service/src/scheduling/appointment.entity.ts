import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * Appointment entity for scheduling patient sessions.
 */
@Entity('appointments')
@Index(['patientId'])
@Index(['datetime'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'uuid' })
  patientId!: string;
  @Column({ type: 'timestamptz' })
  datetime!: Date;
  serviceType!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
