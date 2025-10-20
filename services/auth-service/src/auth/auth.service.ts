import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
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
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email }
      });
      
      if (existingUser) {
        this.logger.error('Registration failed', { email: createUserDto.email, error: 'User with this email already exists' });
        throw new ConflictException('A user with this email address already exists. Please use a different email or try logging in.');
      }

      const hashed = await bcrypt.hash(createUserDto.password, 10);
      const userRole = createUserDto.role && ['therapist', 'patient', 'user'].includes(createUserDto.role)
        ? createUserDto.role
        : 'user';
      const user = this.usersRepository.create({
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashed,
        roles: [userRole],
      });
      await this.usersRepository.save(user);
      const access_token = await this.jwtService.signAsync({
        sub: user.id,
        roles: user.roles,
      });
      return { access_token };
    } catch (error) {
      // If it's already an HTTP exception (like ConflictException), re-throw it
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      // For other errors, log and throw a generic bad request
      this.logger.error('Registration failed', { email: createUserDto.email, error: error instanceof Error ? error.message : String(error) });
      throw new BadRequestException('Registration failed. Please check your information and try again.');
    }
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

  /**
   * Get user information by email for role-based redirection
   */
  async getUserByEmail(email: string) {
    try {
      const user = await this.usersRepository.findOne({ 
        where: { email },
        select: ['id', 'email', 'name', 'roles']
      });
      
      if (!user) {
        this.logger.debug('User not found', { email });
        return null;
      }
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles
      };
    } catch (error) {
      this.logger.error('Failed to get user by email', { email, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}
