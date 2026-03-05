import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { Twilio } from 'twilio';
import { Client } from './client.entity';

/**
 * Service responsible for sending notifications to clients.
 */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);
  private mailer = createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 1025),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  private twilio: Twilio | null;

  constructor() {
    // Initialize Twilio client only if credentials are properly configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken && accountSid.startsWith('AC') && accountSid.length === 34) {
      try {
        this.twilio = new Twilio(accountSid, authToken);
        this.logger.log('✅ Twilio client initialized successfully');
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.warn('⚠️ Failed to initialize Twilio client:', err.message);
        this.twilio = null;
      }
    } else {
      this.logger.warn('⚠️ Twilio credentials not configured or invalid format. SMS functionality disabled.');
      this.twilio = null;
    }
  }

  async sendInvitation(client: Client, _therapistId: number) {
    const inviteLink = `${process.env.APP_URL}/register?email=${encodeURIComponent(
      client.email,
    )}`;
    this.logger.log(`Sending email invitation to ${client.email}`);
    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: "You've been invited",
      html: `<a href="${inviteLink}">Register</a>`,
    });
    if (client.phone) {
      if (this.twilio) {
        this.logger.log(`Sending WhatsApp invitation to ${client.phone}`);
        try {
          await this.twilio.messages.create({
            to: client.phone,
            from: process.env.WHATSAPP_FROM || '',
            body: `You've been invited: ${inviteLink}`,
          });
        } catch (error: unknown) {
          const err = error as Error;
          this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
        }
      } else {
        this.logger.warn('WhatsApp/SMS functionality disabled - Twilio not configured');
      }
    }
  }

  async notifyExisting(client: Client, _therapistId: number) {
    this.logger.log(`Sending existing-user notification to ${client.email}`);
    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: 'New therapist added you',
      text: 'Your therapist added you to their list.',
    });
  }
}
