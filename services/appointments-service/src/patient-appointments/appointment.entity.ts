import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('patient_appointment')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: number;

  @Column()
  therapistId!: number;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;
}
