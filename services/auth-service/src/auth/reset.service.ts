import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetToken } from '../entities/reset-token.entity';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { createTransport } from 'nodemailer';
import { Twilio } from 'twilio';

@Injectable()
export class ResetService {
  private readonly logger = new Logger('ResetService');

  private mailer = createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 1025),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  private twilio?: Twilio;

  private getTwilioClient(): Twilio | null {
    if (this.twilio) return this.twilio;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken || accountSid.includes('placeholder') || authToken.includes('placeholder')) {
      this.logger.warn('Twilio credentials not configured - SMS functionality disabled');
      return null;
    }
    
    try {
      this.twilio = new Twilio(accountSid, authToken);
      return this.twilio;
    } catch (error) {
      this.logger.error('Failed to initialize Twilio client', error);
      return null;
    }
  }

  constructor(
    @InjectRepository(ResetToken) private readonly tokenRepo: Repository<ResetToken>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async requestReset(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`password reset requested for nonexistent email ${email}`);
      return;
    }
    const raw = crypto.randomBytes(32).toString('hex');
    const token = await this.tokenRepo.save({
      token: await bcrypt.hash(raw, 10),
      expiresAt: new Date(Date.now() + 3600_000),
      user,
    });
    this.logger.log(`reset token generated for user ${user.id}`);
    const url = `${process.env.APP_URL}/reset?token=${raw}`;
    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      html: `<a href="${url}">${url}</a>`,
    });
    const phone = (user as any).phone;
    if (phone) {
      const twilioClient = this.getTwilioClient();
      if (twilioClient) {
        try {
          await twilioClient.messages.create({
            to: phone,
            from: process.env.WHATSAPP_FROM || '',
            body: `Reset your password: ${url}`,
          });
          this.logger.log(`SMS reset notification sent to ${phone}`);
        } catch (error) {
          this.logger.error(`Failed to send SMS reset notification: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        this.logger.warn('SMS notification skipped - Twilio not configured');
      }
    }
    return raw;
  }

  async confirmReset(rawToken: string, password: string) {
    const tokens = await this.tokenRepo.find({ where: { used: false } });
    const match = await Promise.all(
      tokens.map(async (t) => ({ token: t, ok: await bcrypt.compare(rawToken, t.token) })),
    );
    const tokenObj = match.find((m) => m.ok)?.token;
    if (!tokenObj) throw new NotFoundException('invalid token');
    if (tokenObj.expiresAt < new Date()) throw new BadRequestException('expired token');
    const user = await this.userRepo.findOne({ where: { id: tokenObj.user.id } });
    if (!user) throw new NotFoundException('user not found');
    user.password = await bcrypt.hash(password, 10);
    await this.userRepo.save(user);
    tokenObj.used = true;
    await this.tokenRepo.save(tokenObj);
    this.logger.log(`password reset for user ${user.id}`);
  }
}
