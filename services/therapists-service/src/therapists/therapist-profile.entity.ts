import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * TherapistProfile holds public therapist information.
 */
@Entity('therapist_profile')
export class TherapistProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  title: string;

  @Column('text')
  bio: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  services: any[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  media: any[];

  @UpdateDateColumn()
  updatedAt: Date;
}
