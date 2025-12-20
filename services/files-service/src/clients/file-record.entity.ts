import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FileRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: number;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @CreateDateColumn()
  uploadedAt!: Date;
}
