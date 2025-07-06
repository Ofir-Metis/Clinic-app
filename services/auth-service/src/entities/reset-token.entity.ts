import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class ResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
