import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class SessionNote {
  id!: number;

  patientId!: number;

  therapistId!: number;

  type!: string;

  note!: string;

  date!: Date;
}
