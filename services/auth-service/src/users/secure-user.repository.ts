import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSecureRepository, SafeQueryService } from '@clinic/common';
import { User } from '../entities/user.entity';

@Injectable()
export class SecureUserRepository extends BaseSecureRepository<User> {
  constructor(
    @InjectRepository(User)
    userRepository: Repository<User>,
    safeQueryService: SafeQueryService
  ) {
    super(userRepository, safeQueryService, {
      maxResults: 100,
      enableAuditLog: true,
      allowedFields: ['email', 'firstName', 'lastName', 'role'] // Only allow searching these fields
    });
  }

  /**
   * Find user by email with SQL injection protection
   */
  async findByEmailSecure(email: string): Promise<User | null> {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email parameter');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const queryBuilder = this.safeQueryService.createSafeQueryBuilder(
        this.repository,
        'user'
      );

      const result = await queryBuilder
        .where('user.email = :email', { email: email.toLowerCase().trim() })
        .getOne();
      return result || null;
    } catch (error) {
      this.logger.error(`Find by email failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Find users by role with validation
   */
  async findByRoleSecure(role: string): Promise<User[]> {
    const allowedRoles = ['client', 'coach', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    try {
      const queryBuilder = this.safeQueryService.createSafeQueryBuilder(
        this.repository,
        'user'
      );

      return await queryBuilder
        .where('user.role = :role', { role })
        .orderBy('user.createdAt', 'DESC')
        .limit(this.options.maxResults || 100)
        .getMany();
    } catch (error) {
      this.logger.error(`Find by role failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Search users with secure text search
   */
  async searchUsersSecure(searchTerm: string, role?: string): Promise<User[]> {
    if (!searchTerm?.trim()) {
      return [];
    }

    try {
      const queryBuilder = this.safeQueryService.createSafeQueryBuilder(
        this.repository,
        'user'
      );

      // Add search conditions for allowed fields
      queryBuilder
        .where('user.firstName ILIKE :search', { search: `%${searchTerm}%` })
        .orWhere('user.lastName ILIKE :search', { search: `%${searchTerm}%` })
        .orWhere('user.email ILIKE :search', { search: `%${searchTerm}%` });

      // Add role filter if specified
      if (role) {
        const allowedRoles = ['client', 'coach', 'admin', 'super_admin'];
        if (allowedRoles.includes(role)) {
          queryBuilder.andWhere('user.role = :role', { role });
        }
      }

      return await queryBuilder
        .orderBy('user.lastName', 'ASC')
        .limit(50) // Limit search results
        .getMany();
    } catch (error) {
      this.logger.error(`User search failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get user statistics with secure aggregation
   */
  async getUserStatsSecure(): Promise<any> {
    try {
      // Use safe query service for aggregation queries
      const stats = await this.safeQueryService.executeQuery(
        this.repository,
        `
          SELECT 
            role,
            COUNT(*) as count,
            COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
          FROM users 
          WHERE "deletedAt" IS NULL
          GROUP BY role
          ORDER BY count DESC
        `,
        [],
        { maxResults: 10 }
      );

      return stats;
    } catch (error) {
      this.logger.error(`Get user stats failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Override entity data validation for User-specific rules
   */
  protected validateEntityData(data: any): void {
    super.validateEntityData(data);

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Validate role if provided
    if (data.role) {
      const allowedRoles = ['client', 'coach', 'admin', 'super_admin'];
      if (!allowedRoles.includes(data.role)) {
        throw new Error('Invalid role specified');
      }
    }

    // Validate name fields
    if (data.firstName && data.firstName.length > 100) {
      throw new Error('First name too long (max 100 characters)');
    }

    if (data.lastName && data.lastName.length > 100) {
      throw new Error('Last name too long (max 100 characters)');
    }

    // Check for potentially dangerous content in text fields
    const textFields = ['firstName', 'lastName', 'bio'];
    textFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        if (this.containsDangerousContent(data[field])) {
          throw new Error(`Invalid content in ${field} field`);
        }
      }
    });
  }

  /**
   * Check for dangerous content in text fields
   */
  private containsDangerousContent(text: string): boolean {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi
    ];

    return dangerousPatterns.some(pattern => pattern.test(text));
  }
}