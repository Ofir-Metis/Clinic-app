import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { Coach } from './coach.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  threadId!: string; // Usually the client ID for 1:1 conversations

  @Column()
  @Index()
  senderId!: string;

  @Column()
  @Index()
  recipientId!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;
}
