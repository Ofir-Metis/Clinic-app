import { Controller, Get, Post, Put, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ValidatedQuery, ValidatedPagination, SecureId, SecureSearchQuery } from '@clinic/common';
import { SecureUserRepository } from './secure-user.repository';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Example controller showing secure database operations
 * This demonstrates proper SQL injection protection patterns
 */
@Controller('users/secure')
@UseGuards(JwtAuthGuard)
export class UsersSecureController {
  constructor(private readonly secureUserRepository: SecureUserRepository) {}

  /**
   * Get all users with secure pagination
   */
  @Get()
  async getUsers(@ValidatedPagination() pagination: any) {
    const { limit, offset, sortBy, sortOrder } = pagination;
    
    // Use secure repository methods
    return await this.secureUserRepository.findSecure({
      take: limit,
      skip: offset,
      order: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'DESC' }
    });
  }

  /**
   * Get user by ID with secure ID validation
   */
  @Get(':id')
  async getUserById(@SecureId() id: number) {
    return await this.secureUserRepository.findByIdSecure(id);
  }

  /**
   * Search users with secure text search
   */
  @Get('search')
  async searchUsers(
    @SecureSearchQuery() searchTerm: string,
    @ValidatedQuery('role') role?: string
  ) {
    if (!searchTerm) {
      return [];
    }
    
    return await this.secureUserRepository.searchUsersSecure(searchTerm, role);
  }

  /**
   * Find user by email with secure parameter validation
   */
  @Get('by-email')
  async findByEmail(@ValidatedQuery('email') email: string) {
    if (!email) {
      throw new Error('Email parameter is required');
    }
    
    return await this.secureUserRepository.findByEmailSecure(email);
  }

  /**
   * Get users by role with secure validation
   */
  @Get('by-role/:role')
  async getUsersByRole(@ValidatedQuery('role') role: string) {
    return await this.secureUserRepository.findByRoleSecure(role);
  }

  /**
   * Create user with secure data validation
   */
  @Post()
  async createUser(@Body() userData: any) {
    // The secure repository will validate the input data
    return await this.secureUserRepository.createSecure(userData);
  }

  /**
   * Update user with secure validation
   */
  @Put(':id')
  async updateUser(
    @SecureId() id: number,
    @Body() updateData: any
  ) {
    return await this.secureUserRepository.updateSecure(id, updateData);
  }

  /**
   * Delete user with secure ID validation
   */
  @Delete(':id')
  async deleteUser(@SecureId() id: number) {
    const success = await this.secureUserRepository.deleteSecure(id);
    return { success };
  }

  /**
   * Get user statistics with secure aggregation
   */
  @Get('stats/overview')
  async getUserStats() {
    return await this.secureUserRepository.getUserStatsSecure();
  }

  /**
   * Advanced search with multiple secure parameters
   */
  @Get('advanced-search')
  async advancedSearch(
    @ValidatedQuery() query: any,
    @ValidatedPagination() pagination: any
  ) {
    const { searchTerm, role, startDate, endDate } = query;
    const { limit, offset } = pagination;

    // Example of building complex secure queries
    const queryBuilder = this.secureUserRepository['safeQueryService']
      .createSafeQueryBuilder(this.secureUserRepository['repository'], 'user');

    // Add search conditions with proper parameterization
    if (searchTerm) {
      queryBuilder
        .where('user.firstName ILIKE :search', { search: `%${searchTerm}%` })
        .orWhere('user.lastName ILIKE :search', { search: `%${searchTerm}%` });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }
}

/**
 * Key Security Features Demonstrated:
 * 
 * 1. ✅ Parameterized Queries - All user input is properly parameterized
 * 2. ✅ Input Validation - SecureId, ValidatedQuery decorators validate input
 * 3. ✅ Search Sanitization - SecureSearchQuery cleans search terms
 * 4. ✅ Pagination Limits - ValidatedPagination enforces safe limits
 * 5. ✅ Field Validation - Only allowed fields can be searched/sorted
 * 6. ✅ Query Limits - Automatic LIMIT clauses prevent large result sets
 * 7. ✅ SQL Injection Protection - Dangerous patterns are detected and blocked
 * 8. ✅ Audit Logging - All database operations are logged for security
 * 9. ✅ Type Safety - TypeScript ensures type correctness
 * 10. ✅ Error Handling - Proper error messages without sensitive data leakage
 */