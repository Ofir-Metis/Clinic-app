import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  therapistId: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
