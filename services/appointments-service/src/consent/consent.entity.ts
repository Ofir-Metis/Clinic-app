/**
 * RecordingConsent Entity - Tracks consent for session recordings
 * Includes audit trail with IP address, user agent, and timestamp
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export interface ConsentedFeatures {
  audioRecording: boolean;
  videoRecording: boolean;
  aiAnalysis: boolean;
  transcription: boolean;
  sharing: boolean;
}

@Entity('recording_consents')
@Index(['appointmentId', 'participantId'], { unique: true })
export class RecordingConsent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id' })
  @Index()
  appointmentId!: string;

  @Column({ name: 'participant_id' })
  @Index()
  participantId!: string;

  @Column({ name: 'participant_role', type: 'varchar', length: 20 })
  participantRole!: 'coach' | 'client';

  @Column({ name: 'participant_name', type: 'varchar', length: 255 })
  participantName!: string;

  @Column({ name: 'consent_given_at', type: 'timestamp with time zone' })
  consentGivenAt!: Date;

  @Column({ name: 'consented_features', type: 'jsonb' })
  consentedFeatures!: ConsentedFeatures;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData!: string | null;

  @Column({ name: 'revoked_at', type: 'timestamp with time zone', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'revoke_reason', type: 'text', nullable: true })
  revokeReason!: string | null;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper method to check if consent is still valid
  isValid(): boolean {
    return this.revokedAt === null;
  }

  // Helper method to check if a specific feature was consented
  hasFeatureConsent(feature: keyof ConsentedFeatures): boolean {
    return this.isValid() && this.consentedFeatures[feature] === true;
  }
}
