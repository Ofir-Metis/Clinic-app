import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('patient_appointment')
export class Appointment {
  id!: number;

  patientId!: number;

  therapistId!: number;

  startTime!: Date;

  endTime!: Date;

  type!: string;

  notes!: string;
}
