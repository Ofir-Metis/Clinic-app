import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  coachId!: string;

  @Column()
  @Index()
  entityId!: string;

  @Column({ default: 'patient' })
  entityType!: 'appointment' | 'patient';

  @Column('text')
  content!: string;

  @Column({ default: true })
  isPrivate!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
