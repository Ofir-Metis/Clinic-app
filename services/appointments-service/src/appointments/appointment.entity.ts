import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Appointment entity representing scheduled sessions.
 */
@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  therapistId: number;

  @Column()
  clientId: number;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column()
  type: string;

  @Column()
  location: string;

  @Column({ default: 'scheduled' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
