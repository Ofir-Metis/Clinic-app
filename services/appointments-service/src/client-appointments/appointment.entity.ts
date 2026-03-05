import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('patient_appointment')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId!: string;

  @Column({ type: 'uuid', name: 'therapist_id' })
  therapistId!: string;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;
}
