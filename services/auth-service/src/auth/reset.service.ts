import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetToken } from '../entities/reset-token.entity';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetService {
  private readonly logger = new Logger('ResetService');

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
    // TODO: send email/WhatsApp with link containing raw token
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
