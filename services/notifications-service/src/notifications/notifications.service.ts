import { Injectable, OnModuleInit } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { Twilio } from 'twilio';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: { url: process.env.NATS_URL },
  });

  private mailer = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  private twilio = new Twilio(
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || '',
  );

  async onModuleInit() {
    const sub = this.client.send('appointment.created', {});
    sub.subscribe();
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.mailer.sendMail({ from: process.env.EMAIL_USER, to, subject, text: body });
  }

  async sendSms(to: string, body: string) {
    return this.twilio.messages.create({
      to,
      from: process.env.TWILIO_FROM || '',
      body,
    });
  }
}
