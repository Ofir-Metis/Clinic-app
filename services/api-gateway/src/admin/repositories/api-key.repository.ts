/**
 * ApiKeyRepository - Repository for API keys with custom queries
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyRepository extends Repository<ApiKey> {
  constructor(private dataSource: DataSource) {
    super(ApiKey, dataSource.createEntityManager());
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    return this.findOne({ where: { keyHash } });
  }

  async findByClientId(clientId: string): Promise<ApiKey[]> {
    return this.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveKeys(): Promise<ApiKey[]> {
    return this.find({
      where: { status: 'active' },
      order: { lastUsed: 'DESC' },
    });
  }

  async findExpiredKeys(): Promise<ApiKey[]> {
    return this.createQueryBuilder('key')
      .where('key.expiresAt IS NOT NULL')
      .andWhere('key.expiresAt < :now', { now: new Date() })
      .andWhere('key.status = :status', { status: 'active' })
      .getMany();
  }

  async updateUsageStats(keyId: string, requestCount: number = 1): Promise<void> {
    await this.createQueryBuilder()
      .update(ApiKey)
      .set({
        totalRequests: () => 'totalRequests + :requestCount',
        requestsThisMonth: () => 'requestsThisMonth + :requestCount',
        lastUsed: new Date(),
      })
      .where('id = :keyId', { keyId })
      .setParameter('requestCount', requestCount)
      .execute();
  }

  async resetMonthlyUsage(): Promise<void> {
    await this.createQueryBuilder()
      .update(ApiKey)
      .set({ requestsThisMonth: 0 })
      .execute();
  }

  async getUsageAnalytics(startDate: Date, endDate: Date): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    topKeysByUsage: Array<{
      id: string;
      name: string;
      clientName: string;
      totalRequests: number;
      requestsThisMonth: number;
    }>;
    keysByStatus: Record<string, number>;
    expiringKeys: number;
  }> {
    const totalKeys = await this.count();
    const activeKeys = await this.count({ where: { status: 'active' } });

    // Total requests (sum from all keys)
    const totalRequestsResult = await this.createQueryBuilder('key')
      .select('SUM(key.totalRequests)', 'total')
      .getRawOne();
    const totalRequests = parseInt(totalRequestsResult?.total || '0');

    // Top keys by usage
    const topKeysByUsage = await this.createQueryBuilder('key')
      .select([
        'key.id',
        'key.name',
        'key.clientName',
        'key.totalRequests',
        'key.requestsThisMonth',
      ])
      .orderBy('key.totalRequests', 'DESC')
      .limit(10)
      .getMany();

    // Keys by status
    const statusStats = await this.createQueryBuilder('key')
      .select('key.status, COUNT(*) as count')
      .groupBy('key.status')
      .getRawMany();

    const keysByStatus = statusStats.reduce((acc, stat) => ({
      ...acc,
      [stat.status]: parseInt(stat.count),
    }), {});

    // Expiring keys (within next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringKeys = await this.count({
      where: {
        status: 'active',
        expiresAt: Between(new Date(), thirtyDaysFromNow),
      },
    });

    return {
      totalKeys,
      activeKeys,
      totalRequests,
      topKeysByUsage,
      keysByStatus,
      expiringKeys,
    };
  }

  async findKeysNeedingRotation(days: number = 90): Promise<ApiKey[]> {
    const rotationDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.createQueryBuilder('key')
      .where('key.status = :status', { status: 'active' })
      .andWhere('(key.regeneratedAt IS NULL AND key.createdAt < :rotationDate)')
      .orWhere('key.regeneratedAt < :rotationDate')
      .setParameter('rotationDate', rotationDate)
      .getMany();
  }

  async getClientUsageReport(clientId: string, days: number = 30): Promise<{
    clientId: string;
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    requestsThisMonth: number;
    avgResponseTime: number;
    errorRate: number;
    rateLimitHits: number;
    keys: Array<{
      id: string;
      name: string;
      status: string;
      totalRequests: number;
      lastUsed: Date;
    }>;
  }> {
    const keys = await this.findByClientId(clientId);
    const totalKeys = keys.length;
    const activeKeys = keys.filter(k => k.status === 'active').length;
    const totalRequests = keys.reduce((sum, k) => sum + k.totalRequests, 0);
    const requestsThisMonth = keys.reduce((sum, k) => sum + k.requestsThisMonth, 0);

    // Mock additional metrics (in real implementation, these would come from monitoring data)
    const avgResponseTime = 125.5;
    const errorRate = 0.02;
    const rateLimitHits = Math.floor(totalRequests * 0.001); // 0.1% rate limit hits

    return {
      clientId,
      totalKeys,
      activeKeys,
      totalRequests,
      requestsThisMonth,
      avgResponseTime,
      errorRate,
      rateLimitHits,
      keys: keys.map(k => ({
        id: k.id,
        name: k.name,
        status: k.status,
        totalRequests: k.totalRequests,
        lastUsed: k.lastUsed,
      })),
    };
  }
}