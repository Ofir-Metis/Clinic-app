/**
 * AdminUserRepository - Repository for admin users with custom queries
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminUserRepository extends Repository<AdminUser> {
  constructor(private dataSource: DataSource) {
    super(AdminUser, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<AdminUser[]> {
    return this.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByRole(role: string): Promise<AdminUser[]> {
    return this.find({
      where: { role },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    mfaEnabledUsers: number;
    lockedUsers: number;
    usersByRole: Record<string, number>;
  }> {
    const totalUsers = await this.count();
    const activeUsers = await this.count({ where: { isActive: true } });
    const verifiedUsers = await this.count({ where: { isVerified: true } });
    const mfaEnabledUsers = await this.count({ where: { mfaEnabled: true } });
    const lockedUsers = await this.count({ 
      where: { lockedUntil: this.dataSource.createQueryBuilder().createQueryBuilder().where('lockedUntil > NOW()').getQuery() } 
    });

    // Get user count by role
    const roleStats = await this.createQueryBuilder('user')
      .select('user.role, COUNT(*) as count')
      .groupBy('user.role')
      .getRawMany();

    const usersByRole = roleStats.reduce((acc, stat) => {
      acc[stat.role] = parseInt(stat.count);
      return acc;
    }, {});

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      mfaEnabledUsers,
      lockedUsers,
      usersByRole,
    };
  }

  async updateLoginInfo(userId: string, ipAddress: string): Promise<void> {
    await this.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(AdminUser)
      .set({
        failedLoginAttempts: () => 'failedLoginAttempts + 1',
      })
      .where('id = :userId', { userId })
      .execute();
  }

  async lockUser(userId: string, lockDuration: number): Promise<void> {
    const lockedUntil = new Date(Date.now() + lockDuration);
    await this.update(userId, { lockedUntil });
  }

  async findUsersWithExpiredPasswords(days: number): Promise<AdminUser[]> {
    return this.createQueryBuilder('user')
      .where('user.lastPasswordChangeAt < :expiredDate OR user.lastPasswordChangeAt IS NULL', {
        expiredDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();
  }

  async findRecentlyActiveUsers(hours: number): Promise<AdminUser[]> {
    return this.createQueryBuilder('user')
      .where('user.lastLoginAt > :recentDate', {
        recentDate: new Date(Date.now() - hours * 60 * 60 * 1000),
      })
      .orderBy('user.lastLoginAt', 'DESC')
      .getMany();
  }
}