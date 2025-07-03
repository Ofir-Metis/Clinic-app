import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class SessionNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  therapistId: number;

  @Column()
  type: string;

  @Column('text')
  note: string;

  @CreateDateColumn()
  date: Date;
}
