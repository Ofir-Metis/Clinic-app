
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

@Entity('session_recordings')
export class SessionRecording {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'appointment_id', type: 'uuid' })
    appointmentId!: string;

    @ManyToOne(() => Appointment)
    @JoinColumn({ name: 'appointment_id' })
    appointment!: Appointment;

    @Column({ name: 'filename', type: 'varchar' })
    filename!: string;

    @Column({ name: 'original_filename', type: 'varchar' })
    originalFilename!: string;

    @Column({ name: 'mime_type', type: 'varchar' })
    mimeType!: string;

    @Column({ name: 'size', type: 'bigint' })
    size!: number;

    @Column({ name: 'duration', type: 'int', default: 0 }) // Duration in seconds
    duration!: number;

    @Column({ name: 'path', type: 'varchar' }) // Local path or S3 key
    path!: string;

    @Column({ name: 'url', type: 'varchar', nullable: true }) // Public/Presigned URL
    url?: string;

    @Column({ name: 'storage_provider', type: 'varchar', default: 'local' })
    storageProvider!: 'local' | 's3' | 'minio';

    @Column({ name: 'processing_status', type: 'varchar', default: 'pending' })
    processingStatus!: 'pending' | 'processing' | 'completed' | 'failed';

    @Column({ name: 'transcription', type: 'text', nullable: true })
    transcription?: string;

    @Column({ name: 'summary', type: 'jsonb', nullable: true })
    summary?: {
        keyPoints: string[];
        actionItems: string[];
        insights: string[];
        recommendations: string[];
        mood: string;
        progressNotes: string;
        nextSessionFocus: string;
    };

    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    metadata?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy!: string;

    // Consent fields
    @Column({ name: 'audio_consent', type: 'boolean', default: false })
    audioConsent!: boolean;

    @Column({ name: 'transcription_consent', type: 'boolean', default: false })
    transcriptionConsent!: boolean;

    @Column({ name: 'ai_analysis_consent', type: 'boolean', default: false })
    aiAnalysisConsent!: boolean;

    @Column({ name: 'consent_given_at', type: 'timestamp', nullable: true })
    consentGivenAt?: Date;

    @Column({ name: 'consent_revoked_at', type: 'timestamp', nullable: true })
    consentRevokedAt?: Date;
}
