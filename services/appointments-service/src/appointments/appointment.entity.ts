import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Appointment entity representing scheduled sessions.
 */
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  therapistId!: number;

  @Column()
  clientId!: number;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ type: 'varchar' })
  type!: 'in-person' | 'virtual';

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string;

  @Column({ type: 'varchar', nullable: true })
  meetingUrl!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
