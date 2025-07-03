import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private mailer = createTransport(process.env.SMTP_URL || '');

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
