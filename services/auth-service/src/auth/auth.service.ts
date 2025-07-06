import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { createLogger, transports, format } from 'winston';

/**
 * Service handling user authentication logic.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [new transports.Console()],
  });

  /**
   * Register a new user and return a signed JWT.
   */
  async register(createUserDto: CreateUserDto) {
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashed,
      roles: ['user'],
    });
    await this.usersRepository.save(user);
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      roles: user.roles,
    });
    return { access_token };
  }

  /**
   * Validate user credentials.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    const { password: _p, ...result } = user;
    return result;
  }

  /**
   * Login and return JWT token.
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.info('login failed', { email: loginDto.email });
      return null;
    }
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      roles: user.roles,
    });
    this.logger.info('login success', { userId: user.id });
    return { access_token };
  }
}
