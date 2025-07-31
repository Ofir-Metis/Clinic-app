/**
 * EmailLog Entity - Track Gmail API email communications
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GoogleAccount } from './google-account.entity';

export type EmailType = 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' | 'custom' | 'follow_up';
export type EmailStatus = 'sent' | 'delivered' | 'failed' | 'bounced' | 'spam';

@Entity('email_log')
@Index(['googleAccountId'])
@Index(['recipientEmail'])
@Index(['emailType'])
@Index(['status'])
@Index(['sentAt'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'google_account_id', type: 'uuid' })
  googleAccountId!: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  // Email details
  @Column({ name: 'recipient_email', length: 255 })
  recipientEmail!: string;

  @Column({ name: 'recipient_name', length: 255, nullable: true })
  recipientName?: string;

  @Column({ name: 'subject', length: 500 })
  subject!: string;

  @Column({ name: 'message_id', length: 255, nullable: true })
  messageId?: string; // Gmail message ID

  @Column({ name: 'thread_id', length: 255, nullable: true })
  threadId?: string; // Gmail thread ID

  @Column({
    name: 'email_type',
    type: 'enum',
    enum: ['confirmation', 'reminder', 'cancellation', 'reschedule', 'custom', 'follow_up']
  })
  emailType!: EmailType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['sent', 'delivered', 'failed', 'bounced', 'spam'],
    default: 'sent'
  })
  status!: EmailStatus;

  // Content tracking
  @Column({ name: 'template_id', length: 100, nullable: true })
  templateId?: string;

  @Column({ name: 'has_attachments', type: 'boolean', default: false })
  hasAttachments!: boolean;

  @Column({ name: 'attachment_count', type: 'int', default: 0 })
  attachmentCount!: number;

  @Column({ name: 'body_preview', length: 1000, nullable: true })
  bodyPreview?: string; // First 1000 chars for preview

  // Delivery tracking
  @Column({ name: 'delivery_status', type: 'jsonb', nullable: true })
  deliveryStatus?: {
    delivered?: boolean;
    deliveredAt?: string;
    opened?: boolean;
    openedAt?: string;
    clicked?: boolean;
    clickedAt?: string;
    bounceReason?: string;
  };

  // Error tracking
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'error_code', length: 50, nullable: true })
  errorCode?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  // Scheduling
  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt?: Date; // For delayed sending

  @Column({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => GoogleAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'google_account_id' })
  googleAccount!: GoogleAccount;

  // Virtual properties
  get isDelivered(): boolean {
    return this.status === 'delivered' || this.deliveryStatus?.delivered === true;
  }

  get requiresRetry(): boolean {
    return this.status === 'failed' && 
           this.retryCount < 3 && 
           (!this.nextRetryAt || new Date() >= this.nextRetryAt);
  }

  get statusDisplay(): string {
    switch (this.status) {
      case 'sent': return '📤 Sent';
      case 'delivered': return '✅ Delivered';
      case 'failed': return '❌ Failed';
      case 'bounced': return '↩️ Bounced';
      case 'spam': return '🚫 Marked as Spam';
      default: return '❓ Unknown';
    }
  }

  get typeDisplay(): string {
    switch (this.emailType) {
      case 'confirmation': return '📅 Appointment Confirmation';
      case 'reminder': return '⏰ Reminder';
      case 'cancellation': return '❌ Cancellation';
      case 'reschedule': return '🔄 Reschedule';
      case 'follow_up': return '📞 Follow-up';
      case 'custom': return '✉️ Custom Message';
      default: return '📧 Email';
    }
  }

  get deliveryMetrics(): {
    sent: boolean;
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
  } {
    return {
      sent: true,
      delivered: this.isDelivered,
      opened: this.deliveryStatus?.opened || false,
      clicked: this.deliveryStatus?.clicked || false
    };
  }
}