import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Patient {
  id!: number;

  firstName!: string;

  lastName!: string;

  email!: string;

  avatarUrl!: string;

  therapistId!: number;

  createdAt!: Date;

  updatedAt!: Date;
}
