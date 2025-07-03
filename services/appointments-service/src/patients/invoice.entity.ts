import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column('decimal')
  amount: number;

  @Column()
  status: string;

  @CreateDateColumn()
  issuedAt: Date;
}
