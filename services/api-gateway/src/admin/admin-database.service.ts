/**
 * AdminDatabaseService - Integration service for real database operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminUserRepository } from './repositories/admin-user.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { AuditEventRepository } from './repositories/audit-event.repository';
import { PerformanceMetricRepository } from './repositories/performance-metric.repository';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemAlert } from './entities/system-alert.entity';
import { BackupJob } from './entities/backup-job.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AdminDatabaseService {
  private readonly logger = new Logger(AdminDatabaseService.name);

  constructor(
    private adminUserRepository: AdminUserRepository,
    private apiKeyRepository: ApiKeyRepository,
    private auditEventRepository: AuditEventRepository,
    private performanceMetricRepository: PerformanceMetricRepository,
    @InjectRepository(SystemConfig) private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(SystemAlert) private systemAlertRepository: Repository<SystemAlert>,
    @InjectRepository(BackupJob) private backupJobRepository: Repository<BackupJob>,
  ) {}

  /**
   * Admin User Management
   */
  async createAdminUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    permissions: string[];
    createdBy: string;
  }) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const user = this.adminUserRepository.create({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash,
      role: userData.role,
      permissions: userData.permissions,
      createdBy: userData.createdBy,
      isActive: true,
      isVerified: false,
    });

    return this.adminUserRepository.save(user);
  }

  async validateAdminUser(email: string, password: string) {
    const user = await this.adminUserRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await this.adminUserRepository.incrementFailedAttempts(user.id);
      
      if (user.failedLoginAttempts >= 4) { // 5 attempts total
        await this.adminUserRepository.lockUser(user.id, 30 * 60 * 1000); // 30 minutes
      }
      return null;
    }

    await this.adminUserRepository.updateLoginInfo(user.id, '0.0.0.0'); // Would be real IP
    return user;
  }

  async getAdminUsers() {
    return this.adminUserRepository.findActiveUsers();
  }

  async getUserStats() {
    return this.adminUserRepository.getUserStats();
  }

  /**
   * API Key Management
   */
  async createApiKey(keyData: {
    name: string;
    clientId: string;
    clientName: string;
    permissions: string[];
    rateLimits: any;
    expiresAt?: Date;
    metadata?: any;
    createdBy: string;
  }) {
    const apiKey = this.generateApiKey();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPreview = `${apiKey.substring(0, 20)}...`;

    const apiKeyEntity = this.apiKeyRepository.create({
      ...keyData,
      keyHash,
      keyPreview,
      status: 'active',
    });

    const savedKey = await this.apiKeyRepository.save(apiKeyEntity);
    
    // Return the plain API key only on creation
    return {
      ...savedKey,
      apiKey,
    };
  }

  async getApiKeys(filters: any = {}) {
    let query = this.apiKeyRepository.createQueryBuilder('key');

    if (filters.clientId) {
      query.andWhere('key.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.status) {
      query.andWhere('key.status = :status', { status: filters.status });
    }

    query.orderBy('key.createdAt', 'DESC');

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const [keys, total] = await query.getManyAndCount();
    
    return {
      keys,
      total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit || 50)),
    };
  }

  async revokeApiKey(keyId: string, reason: string, revokedBy: string) {
    await this.apiKeyRepository.update(keyId, {
      status: 'revoked',
      revocationReason: reason,
      revokedAt: new Date(),
      revokedBy,
    });
  }

  async trackApiKeyUsage(keyHash: string, requestCount: number = 1) {
    const key = await this.apiKeyRepository.findByKeyHash(keyHash);
    if (key) {
      await this.apiKeyRepository.updateUsageStats(key.id, requestCount);
    }
  }

  private generateApiKey(): string {
    return `clinic_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Audit Trail Management
   */
  async createAuditEvent(eventData: {
    userId: string;
    userEmail: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    resourceType: string;
    outcome: 'success' | 'failure' | 'warning';
    ipAddress: string;
    userAgent?: string;
    sessionId?: string;
    details?: any;
    riskLevel?: string;
    complianceFlags?: string[];
    dataClassification?: string;
  }) {
    const auditEvent = this.auditEventRepository.create({
      ...eventData,
      timestamp: new Date(),
      riskLevel: eventData.riskLevel || 'low',
    });

    return this.auditEventRepository.save(auditEvent);
  }

  async getAuditEvents(filters: any = {}) {
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    return this.auditEventRepository.findByDateRange(
      startDate,
      endDate,
      filters.limit || 100,
      filters.offset || 0
    );
  }

  async getComplianceReport(startDate: Date, endDate: Date) {
    return this.auditEventRepository.getComplianceReport(startDate, endDate);
  }

  async getSuspiciousActivity(hours: number = 24) {
    return this.auditEventRepository.findSuspiciousActivity(hours);
  }

  /**
   * System Configuration Management
   */
  async getSystemConfig(key: string, environment: string = 'production') {
    return this.systemConfigRepository.findOne({
      where: { key, environment },
    });
  }

  async setSystemConfig(configData: {
    key: string;
    value: string;
    type?: string;
    environment?: string;
    service?: string;
    category: string;
    description?: string;
    isSecret?: boolean;
    createdBy: string;
  }) {
    const config = this.systemConfigRepository.create({
      ...configData,
      environment: configData.environment || 'production',
      type: configData.type || 'string',
      version: 1,
    });

    return this.systemConfigRepository.save(config);
  }

  async getSystemConfigs(filters: any = {}) {
    let query = this.systemConfigRepository.createQueryBuilder('config');

    if (filters.environment) {
      query.andWhere('config.environment = :environment', { environment: filters.environment });
    }

    if (filters.service) {
      query.andWhere('config.service = :service', { service: filters.service });
    }

    if (filters.category) {
      query.andWhere('config.category = :category', { category: filters.category });
    }

    query.orderBy('config.category', 'ASC').addOrderBy('config.key', 'ASC');

    return query.getMany();
  }

  /**
   * System Alerts Management
   */
  async createSystemAlert(alertData: {
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    alertType: string;
    service?: string;
    metric?: string;
    threshold?: number;
    currentValue?: number;
    metadata?: any;
  }) {
    const alert = this.systemAlertRepository.create(alertData);
    return this.systemAlertRepository.save(alert);
  }

  async getActiveAlerts() {
    return this.systemAlertRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async resolveAlert(alertId: string, resolution: string, resolvedBy: string) {
    await this.systemAlertRepository.update(alertId, {
      status: 'resolved',
      resolution,
      resolvedAt: new Date(),
      resolvedBy,
    });
  }

  /**
   * Backup Management
   */
  async createBackupJob(jobData: {
    name: string;
    description?: string;
    type: 'full' | 'incremental' | 'differential' | 'snapshot';
    sources: string[];
    destination: string;
    encrypted?: boolean;
    compressed?: boolean;
    schedule?: string;
    retentionDays?: number;
    createdBy: string;
  }) {
    const job = this.backupJobRepository.create({
      ...jobData,
      status: 'pending',
      retentionDays: jobData.retentionDays || 30,
    });

    return this.backupJobRepository.save(job);
  }

  async updateBackupJobStatus(jobId: string, status: string, updates: any = {}) {
    const updateData = { status, ...updates };
    
    if (status === 'running' && !updates.startedAt) {
      updateData.startedAt = new Date();
    }
    
    if (status === 'completed' && !updates.completedAt) {
      updateData.completedAt = new Date();
      updateData.progressPercentage = 100;
    }

    await this.backupJobRepository.update(jobId, updateData);
  }

  async getBackupJobs(limit: number = 50) {
    return this.backupJobRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Performance Metrics
   */
  async recordPerformanceMetric(
    service: string,
    metricName: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
    metadata?: any,
  ) {
    return this.performanceMetricRepository.recordMetric(
      service,
      metricName,
      value,
      unit,
      tags,
      metadata,
    );
  }

  async getPerformanceMetrics(
    service: string,
    metricName: string,
    startTime: Date,
    endTime: Date,
    interval: 'minute' | 'hour' | 'day' = 'hour',
  ) {
    return this.performanceMetricRepository.getMetricSeries(
      service,
      metricName,
      startTime,
      endTime,
      interval,
    );
  }

  async getSystemPerformanceOverview(startTime: Date, endTime: Date) {
    return this.performanceMetricRepository.getSystemOverview(startTime, endTime);
  }

  async getSlowQueries(service: string, hours: number = 24, limit: number = 10) {
    return this.performanceMetricRepository.getTopSlowQueries(service, limit, hours);
  }

  /**
   * Health Checks and Monitoring
   */
  async getSystemHealth() {
    try {
      // Test database connectivity
      await this.adminUserRepository.count();
      
      // Get recent alerts
      const recentAlerts = await this.systemAlertRepository.find({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      // Get performance metrics alerts
      const performanceAlerts = await this.performanceMetricRepository.getAlertConditions();

      // Calculate health metrics
      const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical').length;
      const warningAlerts = recentAlerts.filter(a => a.severity === 'warning').length;

      const status = criticalAlerts > 0 ? 'unhealthy' : 
                    warningAlerts > 0 ? 'degraded' : 'healthy';

      return {
        status,
        database: {
          connected: true,
          responseTime: 0, // Would measure actual response time
        },
        alerts: {
          total: recentAlerts.length,
          critical: criticalAlerts,
          warning: warningAlerts,
          info: recentAlerts.filter(a => a.severity === 'info').length,
        },
        performance: {
          alertConditions: performanceAlerts.length,
        },
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message,
        },
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Maintenance Operations
   */
  async cleanupOldData(retentionDays: number = 90) {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean up old audit events
    const deletedAuditEvents = await this.auditEventRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    // Clean up old performance metrics
    const deletedMetrics = await this.performanceMetricRepository
      .cleanupOldMetrics(retentionDays);

    // Clean up old backup jobs
    const deletedBackups = await this.backupJobRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate AND status IN (:...statuses)', {
        cutoffDate,
        statuses: ['completed', 'failed'],
      })
      .execute();

    this.logger.log(`Cleanup completed: ${deletedAuditEvents.affected} audit events, ${deletedMetrics} metrics, ${deletedBackups.affected} backup jobs`);

    return {
      auditEvents: deletedAuditEvents.affected || 0,
      performanceMetrics: deletedMetrics,
      backupJobs: deletedBackups.affected || 0,
    };
  }
}