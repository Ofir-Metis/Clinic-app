import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private mailer: any;

  constructor() {
    // Initialize mailer with proper configuration or fallback
    if (process.env.SMTP_URL && process.env.SMTP_URL.trim() !== '') {
      this.mailer = createTransport(process.env.SMTP_URL);
    } else {
      // Fallback configuration for development
      this.mailer = createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false,
        auth: process.env.EMAIL_USER ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        } : undefined,
      });
    }
  }

  async sendAppointmentInvite(contact: string, details: any) {
    if (contact.includes('@')) {
      await this.mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: contact,
        subject: 'Appointment Scheduled',
        text: `Appointment scheduled on ${details.datetime}`,
      });
    } else {
      await axios.post('https://api.whatsapp.com/send', {
        apiKey: process.env.WHATSAPP_API_KEY,
        to: contact,
        message: `Appointment scheduled on ${details.datetime}`,
      });
    }
  }
}
