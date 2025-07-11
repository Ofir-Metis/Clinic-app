import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * UserSettings entity storing key/value pairs per user.
 */
@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  key!: string;

  @Column('text')
  value!: string;

  @Column()
  category!: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
