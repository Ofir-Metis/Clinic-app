import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Patient entity representing a client assigned to a therapist.
 */
@Entity()
export class Patient {
  id!: number;

  firstName!: string;

  lastName!: string;

  email!: string;

  phone!: string;

  whatsappOptIn!: boolean;

  therapistId!: number;

  createdAt!: Date;

  updatedAt!: Date;
}
