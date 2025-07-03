import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { Twilio } from 'twilio';
import { Patient } from './patient.entity';

/**
 * Service responsible for sending notifications to patients.
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

  private twilio = new Twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || '',
  );

  async sendInvitation(patient: Patient, therapistId: number) {
    const inviteLink = `${process.env.APP_URL}/register?email=${encodeURIComponent(
      patient.email,
    )}`;
    this.logger.log(`Sending email invitation to ${patient.email}`);
    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: "You've been invited",
      html: `<a href="${inviteLink}">Register</a>`,
    });
    if (patient.whatsappOptIn) {
      this.logger.log(`Sending WhatsApp invitation to ${patient.phone}`);
      await this.twilio.messages.create({
        to: patient.phone,
        from: process.env.WHATSAPP_FROM || '',
        body: `You've been invited: ${inviteLink}`,
      });
    }
  }

  async notifyExisting(patient: Patient, therapistId: number) {
    this.logger.log(`Sending existing-user notification to ${patient.email}`);
    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'New therapist added you',
      text: 'Your therapist added you to their list.',
    });
  }
}
