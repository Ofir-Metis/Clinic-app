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
  type: 'in-person' | 'virtual';

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  meetingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
