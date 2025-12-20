/**
 * GmailService - Handle Gmail API operations
 * Send emails, manage templates, and track delivery
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { EmailLog } from '../entities/email-log.entity';
import { GoogleOAuthService } from '../auth/google-oauth.service';
import { EmailTemplatesService } from './email-templates.service';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  scheduledAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly emailTemplatesService: EmailTemplatesService
  ) {}

  /**
   * Send an email via Gmail API
   */
  async sendEmail(
    googleAccountId: string,
    emailOptions: EmailOptions,
    emailType: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' | 'custom' | 'follow_up' = 'custom',
    appointmentId?: string
  ): Promise<EmailResult> {
    try {
      const googleAccount = await this.googleOAuthService.getGoogleAccount(googleAccountId);
      if (!googleAccount?.gmailSyncEnabled) {
        return { success: false, error: 'Gmail sync disabled' };
      }

      const auth = await this.googleOAuthService.getAuthenticatedClient(googleAccountId);
      const gmail = google.gmail({ version: 'v1', auth });

      // Prepare email content
      let htmlBody = emailOptions.htmlBody;
      let textBody = emailOptions.textBody;

      // Use template if specified
      if (emailOptions.templateId) {
        const templateContent = await this.emailTemplatesService.renderTemplate(
          emailOptions.templateId,
          emailOptions.templateData || {}
        );
        htmlBody = templateContent.html;
        textBody = templateContent.text;
      }

      // Build email message
      const emailMessage = await this.buildEmailMessage({
        from: `${googleAccount.displayName || 'Clinic'} <${googleAccount.email}>`,
        to: emailOptions.toName ? `${emailOptions.toName} <${emailOptions.to}>` : emailOptions.to,
        subject: emailOptions.subject,
        htmlBody,
        textBody,
        attachments: emailOptions.attachments,
        replyTo: emailOptions.replyTo,
        cc: emailOptions.cc,
        bcc: emailOptions.bcc,
      });

      // Send email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: emailMessage,
        },
      });

      const messageId = response.data.id ?? undefined;
      const threadId = response.data.threadId ?? undefined;

      // Log email
      await this.logEmail({
        googleAccountId,
        appointmentId,
        recipientEmail: emailOptions.to,
        recipientName: emailOptions.toName,
        subject: emailOptions.subject,
        messageId,
        threadId,
        emailType,
        templateId: emailOptions.templateId,
        hasAttachments: !!(emailOptions.attachments?.length),
        attachmentCount: emailOptions.attachments?.length || 0,
        bodyPreview: this.extractBodyPreview(textBody || htmlBody),
        scheduledAt: emailOptions.scheduledAt,
        status: 'sent',
      });

      this.logger.log(`Sent email via Gmail: ${messageId} to ${emailOptions.to}`);

      return {
        success: true,
        messageId,
        threadId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email via Gmail: ${errorMessage}`);

      // Log failed email
      await this.logEmail({
        googleAccountId,
        appointmentId,
        recipientEmail: emailOptions.to,
        recipientName: emailOptions.toName,
        subject: emailOptions.subject,
        emailType,
        templateId: emailOptions.templateId,
        hasAttachments: !!(emailOptions.attachments?.length),
        attachmentCount: emailOptions.attachments?.length || 0,
        bodyPreview: this.extractBodyPreview(emailOptions.textBody || emailOptions.htmlBody),
        scheduledAt: emailOptions.scheduledAt,
        status: 'failed',
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(
    googleAccountId: string,
    appointmentData: {
      id: string;
      patientEmail: string;
      patientName: string;
      therapistName: string;
      appointmentDate: Date;
      appointmentTime: string;
      duration: number;
      location?: string;
      meetingUrl?: string;
      notes?: string;
    }
  ): Promise<EmailResult> {
    return await this.sendEmail(
      googleAccountId,
      {
        to: appointmentData.patientEmail,
        toName: appointmentData.patientName,
        subject: `Appointment Confirmation - ${appointmentData.appointmentDate.toLocaleDateString()}`,
        templateId: 'appointment-confirmation',
        templateData: appointmentData,
      },
      'confirmation',
      appointmentData.id
    );
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(
    googleAccountId: string,
    appointmentData: {
      id: string;
      patientEmail: string;
      patientName: string;
      therapistName: string;
      appointmentDate: Date;
      appointmentTime: string;
      location?: string;
      meetingUrl?: string;
      hoursUntil: number;
    }
  ): Promise<EmailResult> {
    const subject = appointmentData.hoursUntil <= 2 
      ? `Appointment Reminder - Starting Soon`
      : `Appointment Reminder - Tomorrow`;

    return await this.sendEmail(
      googleAccountId,
      {
        to: appointmentData.patientEmail,
        toName: appointmentData.patientName,
        subject,
        templateId: 'appointment-reminder',
        templateData: appointmentData,
      },
      'reminder',
      appointmentData.id
    );
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(
    googleAccountId: string,
    appointmentData: {
      id: string;
      patientEmail: string;
      patientName: string;
      therapistName: string;
      appointmentDate: Date;
      appointmentTime: string;
      cancellationReason?: string;
      rescheduleUrl?: string;
    }
  ): Promise<EmailResult> {
    return await this.sendEmail(
      googleAccountId,
      {
        to: appointmentData.patientEmail,
        toName: appointmentData.patientName,
        subject: `Appointment Cancelled - ${appointmentData.appointmentDate.toLocaleDateString()}`,
        templateId: 'appointment-cancellation',
        templateData: appointmentData,
      },
      'cancellation',
      appointmentData.id
    );
  }

  /**
   * Build RFC 2822 email message
   */
  private async buildEmailMessage(options: {
    from: string;
    to: string;
    subject: string;
    htmlBody?: string;
    textBody?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<string> {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    let message = [
      `From: ${options.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
    ];

    if (options.replyTo) {
      message.push(`Reply-To: ${options.replyTo}`);
    }
    if (options.cc?.length) {
      message.push(`Cc: ${options.cc.join(', ')}`);
    }
    if (options.bcc?.length) {
      message.push(`Bcc: ${options.bcc.join(', ')}`);
    }

    message.push(`MIME-Version: 1.0`);

    if (options.attachments?.length) {
      message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    } else if (options.htmlBody && options.textBody) {
      message.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    } else if (options.htmlBody) {
      message.push(`Content-Type: text/html; charset=utf-8`);
    } else {
      message.push(`Content-Type: text/plain; charset=utf-8`);
    }

    message.push('');

    // Add body content
    if (options.htmlBody && options.textBody) {
      // Multipart alternative (text + HTML)
      message.push(`--${boundary}`);
      message.push('Content-Type: text/plain; charset=utf-8');
      message.push('');
      message.push(options.textBody);
      message.push('');
      message.push(`--${boundary}`);
      message.push('Content-Type: text/html; charset=utf-8');
      message.push('');
      message.push(options.htmlBody);
      message.push('');
    } else if (options.htmlBody) {
      if (options.attachments?.length) {
        message.push(`--${boundary}`);
        message.push('Content-Type: text/html; charset=utf-8');
        message.push('');
      }
      message.push(options.htmlBody);
      if (options.attachments?.length) {
        message.push('');
      }
    } else if (options.textBody) {
      if (options.attachments?.length) {
        message.push(`--${boundary}`);
        message.push('Content-Type: text/plain; charset=utf-8');
        message.push('');
      }
      message.push(options.textBody);
      if (options.attachments?.length) {
        message.push('');
      }
    }

    // Add attachments
    if (options.attachments?.length) {
      for (const attachment of options.attachments) {
        message.push(`--${boundary}`);
        message.push(`Content-Type: ${attachment.contentType || 'application/octet-stream'}`);
        message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        message.push('Content-Transfer-Encoding: base64');
        message.push('');
        
        const content = Buffer.isBuffer(attachment.content) 
          ? attachment.content 
          : Buffer.from(attachment.content, 'utf-8');
        message.push(content.toString('base64'));
        message.push('');
      }
      message.push(`--${boundary}--`);
    } else if ((options.htmlBody && options.textBody) || options.attachments?.length) {
      message.push(`--${boundary}--`);
    }

    // Encode as base64url
    const rawMessage = message.join('\r\n');
    return Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Extract body preview for logging
   */
  private extractBodyPreview(body?: string): string | undefined {
    if (!body) return undefined;
    
    // Strip HTML tags and get first 1000 characters
    const textOnly = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return textOnly.length > 1000 ? textOnly.substring(0, 1000) + '...' : textOnly;
  }

  /**
   * Log email activity
   */
  private async logEmail(data: {
    googleAccountId: string;
    appointmentId?: string;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    messageId?: string;
    threadId?: string;
    emailType: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' | 'custom' | 'follow_up';
    templateId?: string;
    hasAttachments: boolean;
    attachmentCount: number;
    bodyPreview?: string;
    scheduledAt?: Date;
    status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'spam';
    errorMessage?: string;
    errorCode?: string;
  }): Promise<EmailLog> {
    const emailLog = this.emailLogRepository.create({
      googleAccountId: data.googleAccountId,
      appointmentId: data.appointmentId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      messageId: data.messageId,
      threadId: data.threadId,
      emailType: data.emailType,
      templateId: data.templateId,
      hasAttachments: data.hasAttachments,
      attachmentCount: data.attachmentCount,
      bodyPreview: data.bodyPreview,
      scheduledAt: data.scheduledAt,
      status: data.status,
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,
      sentAt: new Date(),
    });

    return await this.emailLogRepository.save(emailLog);
  }

  /**
   * Get email logs for a Google account
   */
  async getEmailLogs(
    googleAccountId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: EmailLog[]; total: number }> {
    const [logs, total] = await this.emailLogRepository.findAndCount({
      where: { googleAccountId },
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  /**
   * Retry failed emails
   */
  async retryFailedEmails(googleAccountId: string): Promise<number> {
    const failedEmails = await this.emailLogRepository.find({
      where: {
        googleAccountId,
        status: 'failed',
        retryCount: { $lt: 3 } as any,
      },
      order: { sentAt: 'ASC' },
      take: 10, // Process 10 at a time
    });

    let retriedCount = 0;

    for (const emailLog of failedEmails) {
      try {
        // Update retry count
        emailLog.retryCount += 1;
        emailLog.nextRetryAt = new Date(Date.now() + Math.pow(2, emailLog.retryCount) * 60000); // Exponential backoff

        await this.emailLogRepository.save(emailLog);
        retriedCount++;

        this.logger.log(`Retrying email ${emailLog.id} to ${emailLog.recipientEmail} (attempt ${emailLog.retryCount})`);

      } catch (error) {
        this.logger.error(`Failed to retry email ${emailLog.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return retriedCount;
  }

  /**
   * Get email delivery statistics
   */
  async getEmailStats(googleAccountId: string, days = 30): Promise<{
    totalSent: number;
    delivered: number;
    failed: number;
    byType: Record<string, number>;
    deliveryRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.emailLogRepository.find({
      where: {
        googleAccountId,
        sentAt: { $gte: startDate } as any,
      },
    });

    const stats = {
      totalSent: logs.length,
      delivered: logs.filter(log => log.status === 'delivered' || log.status === 'sent').length,
      failed: logs.filter(log => log.status === 'failed').length,
      byType: {} as Record<string, number>,
      deliveryRate: 0,
    };

    // Count by email type
    logs.forEach(log => {
      stats.byType[log.emailType] = (stats.byType[log.emailType] || 0) + 1;
    });

    // Calculate delivery rate
    stats.deliveryRate = stats.totalSent > 0 ? (stats.delivered / stats.totalSent) * 100 : 0;

    return stats;
  }
}