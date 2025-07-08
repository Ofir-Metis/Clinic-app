import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Appointment entity representing scheduled sessions.
 */
@Entity()
export class Appointment {
  id!: number;

  therapistId!: number;

  clientId!: number;

  startTime!: Date;

  endTime!: Date;

  type!: 'in-person' | 'virtual';

  status!: string;

  location!: string;

  meetingUrl!: string;

  createdAt!: Date;

  updatedAt!: Date;
}
