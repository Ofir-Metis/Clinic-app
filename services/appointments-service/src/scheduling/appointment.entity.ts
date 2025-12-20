import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * Appointment entity for scheduling patient sessions.
 */
@Entity('appointments')
@Index(['patientId'])
@Index(['datetime'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  patientId!: number;
  @Column({ type: 'timestamptz' })
  datetime!: Date;
  serviceType!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
