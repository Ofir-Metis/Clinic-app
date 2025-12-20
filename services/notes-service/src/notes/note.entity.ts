import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  coachId!: number;

  @Column('text')
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
