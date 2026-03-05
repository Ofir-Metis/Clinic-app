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
  ) { }

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
      const validRoles = ['therapist', 'patient', 'user', 'admin', 'coach', 'client'];
      const userRole = createUserDto.role && validRoles.includes(createUserDto.role)
        ? createUserDto.role
        : 'user';
      const user = this.usersRepository.create({
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashed,
        roles: [userRole],
      });
      await this.usersRepository.save(user);

      // Create coach record for coach/therapist users to ensure coachId is available on login
      if (userRole === 'coach' || userRole === 'therapist') {
        await this.createCoachRecord(createUserDto);
      }

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
    this.logger.info('Validating user', { email });
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.error('User not found', { email });
      return null;
    }
    this.logger.info('User found', { id: user.id });
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      this.logger.error('Password mismatch', { email });
      return null;
    }
    this.logger.info('Password match', { email });
    const { password: _p, ...result } = user;
    return result;
  }

  /**
   * Login and return JWT token along with user information.
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.info('login failed', { email: loginDto.email });
      return null;
    }
    this.logger.info('login success', { userId: user.id });

    // Fetch profile ID based on role (check both 'coach' and 'therapist' roles)
    let profileId: string | undefined;
    if (user.roles.includes('coach') || user.roles.includes('therapist')) {
      let coaches = await this.usersRepository.query(
        'SELECT id FROM coaches WHERE email = $1',
        [user.email]
      );
      // Auto-create coach record if missing (for users registered before coach record creation was added)
      if (!coaches || coaches.length === 0) {
        this.logger.info('No coach record found, creating one', { email: user.email });
        await this.createCoachRecord({ email: user.email, name: user.name, password: '' } as CreateUserDto);
        coaches = await this.usersRepository.query(
          'SELECT id FROM coaches WHERE email = $1',
          [user.email]
        );
      }
      if (coaches && coaches.length > 0) {
        profileId = coaches[0].id;
      }
    }

    // Sign token with coachId included in payload
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      roles: user.roles,
      coachId: profileId, // Add coachId to token payload
    });

    // Return both token and user info for proper client-side data isolation
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        coachId: profileId
      }
    };
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

  /**
   * Create a coach record for newly registered coach/therapist users.
   * This ensures coachId is available on login for proper data isolation.
   */
  private async createCoachRecord(dto: CreateUserDto): Promise<void> {
    try {
      // Parse name into first/last
      const nameParts = (dto.name || '').split(' ');
      const firstName = nameParts[0] || 'Coach';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await this.usersRepository.query(
        `INSERT INTO coaches (
          id, first_name, last_name, email, status, created_at, updated_at,
          professional_title, bio, specializations, verification_status,
          email_verified, phone_verified, background_check_completed,
          total_reviews, total_sessions_conducted, total_clients_served, accepting_new_clients
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, 'active', NOW(), NOW(),
          'Life Coach', 'Welcome to my practice.', '{}', 'not_verified',
          false, false, false,
          0, 0, 0, true
        )
        ON CONFLICT (email) DO NOTHING`,
        [firstName, lastName, dto.email]
      );
      this.logger.info('Coach record created for new user', { email: dto.email });
    } catch (error) {
      this.logger.error('Failed to create coach record', {
        email: dto.email,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - user registration succeeded, coach record is secondary
    }
  }
}
