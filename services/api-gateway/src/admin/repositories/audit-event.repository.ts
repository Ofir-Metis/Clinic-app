/**
 * AuditEventRepository - Repository for audit events with custom queries
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { AuditEvent } from '../entities/audit-event.entity';

@Injectable()
export class AuditEventRepository extends Repository<AuditEvent> {
  constructor(private dataSource: DataSource) {
    super(AuditEvent, dataSource.createEntityManager());
  }

  async findByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<{
    events: AuditEvent[];
    total: number;
  }> {
    const [events, total] = await this.findAndCount({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { events, total };
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditEvent[]> {
    return this.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findByRiskLevel(riskLevel: string, limit: number = 100): Promise<AuditEvent[]> {
    return this.find({
      where: { riskLevel },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findFailedActions(hours: number = 24): Promise<AuditEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.find({
      where: {
        outcome: 'failure',
        timestamp: Between(startDate, new Date()),
      },
      order: { timestamp: 'DESC' },
    });
  }

  async getComplianceReport(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsByOutcome: Record<string, number>;
    eventsByRiskLevel: Record<string, number>;
    eventsByResourceType: Record<string, number>;
    criticalEvents: number;
    failedActions: number;
    complianceFlaggedEvents: number;
  }> {
    const totalEvents = await this.count({
      where: {
        timestamp: Between(startDate, endDate),
      },
    });

    // Events by outcome
    const outcomeStats = await this.createQueryBuilder('event')
      .select('event.outcome, COUNT(*) as count')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.outcome')
      .getRawMany();

    // Events by risk level
    const riskStats = await this.createQueryBuilder('event')
      .select('event.riskLevel, COUNT(*) as count')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.riskLevel')
      .getRawMany();

    // Events by resource type
    const resourceStats = await this.createQueryBuilder('event')
      .select('event.resourceType, COUNT(*) as count')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.resourceType')
      .getRawMany();

    const criticalEvents = await this.count({
      where: {
        riskLevel: 'critical',
        timestamp: Between(startDate, endDate),
      },
    });

    const failedActions = await this.count({
      where: {
        outcome: 'failure',
        timestamp: Between(startDate, endDate),
      },
    });

    const complianceFlaggedEvents = await this.createQueryBuilder('event')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('JSON_LENGTH(event.complianceFlags) > 0')
      .getCount();

    return {
      totalEvents,
      eventsByOutcome: outcomeStats.reduce((acc, stat) => ({ ...acc, [stat.outcome]: parseInt(stat.count) }), {}),
      eventsByRiskLevel: riskStats.reduce((acc, stat) => ({ ...acc, [stat.riskLevel]: parseInt(stat.count) }), {}),
      eventsByResourceType: resourceStats.reduce((acc, stat) => ({ ...acc, [stat.resourceType]: parseInt(stat.count) }), {}),
      criticalEvents,
      failedActions,
      complianceFlaggedEvents,
    };
  }

  async findSuspiciousActivity(hours: number = 24): Promise<{
    multipleFailedLogins: AuditEvent[];
    unusualIpAddresses: AuditEvent[];
    afterHoursActivity: AuditEvent[];
  }> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Multiple failed login attempts from same IP
    const multipleFailedLogins = await this.createQueryBuilder('event')
      .where('event.action = :action', { action: 'login_attempt' })
      .andWhere('event.outcome = :outcome', { outcome: 'failure' })
      .andWhere('event.timestamp > :startDate', { startDate })
      .groupBy('event.ipAddress')
      .having('COUNT(*) >= 5')
      .getMany();

    // Activity from new/unusual IP addresses
    const unusualIpAddresses = await this.createQueryBuilder('event')
      .where('event.timestamp > :startDate', { startDate })
      .andWhere('event.riskLevel IN (:...levels)', { levels: ['medium', 'high', 'critical'] })
      .getMany();

    // After-hours activity (assuming business hours 9-17)
    const afterHoursActivity = await this.createQueryBuilder('event')
      .where('event.timestamp > :startDate', { startDate })
      .andWhere('(HOUR(event.timestamp) < 9 OR HOUR(event.timestamp) > 17)')
      .andWhere('event.action NOT IN (:...automatedActions)', {
        automatedActions: ['system_backup', 'scheduled_job', 'health_check'],
      })
      .getMany();

    return {
      multipleFailedLogins,
      unusualIpAddresses,
      afterHoursActivity,
    };
  }

  async getAuditMetrics(days: number = 30): Promise<{
    dailyEventCounts: Array<{ date: string; count: number }>;
    topUsers: Array<{ userEmail: string; eventCount: number }>;
    topActions: Array<{ action: string; count: number }>;
    riskTrends: Array<{ date: string; critical: number; high: number; medium: number; low: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily event counts
    const dailyEvents = await this.createQueryBuilder('event')
      .select('DATE(event.timestamp) as date, COUNT(*) as count')
      .where('event.timestamp > :startDate', { startDate })
      .groupBy('DATE(event.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Top users by event count
    const topUsers = await this.createQueryBuilder('event')
      .select('event.userEmail, COUNT(*) as eventCount')
      .where('event.timestamp > :startDate', { startDate })
      .groupBy('event.userEmail')
      .orderBy('eventCount', 'DESC')
      .limit(10)
      .getRawMany();

    // Top actions
    const topActions = await this.createQueryBuilder('event')
      .select('event.action, COUNT(*) as count')
      .where('event.timestamp > :startDate', { startDate })
      .groupBy('event.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Risk level trends
    const riskTrends = await this.createQueryBuilder('event')
      .select([
        'DATE(event.timestamp) as date',
        'SUM(CASE WHEN event.riskLevel = "critical" THEN 1 ELSE 0 END) as critical',
        'SUM(CASE WHEN event.riskLevel = "high" THEN 1 ELSE 0 END) as high',
        'SUM(CASE WHEN event.riskLevel = "medium" THEN 1 ELSE 0 END) as medium',
        'SUM(CASE WHEN event.riskLevel = "low" THEN 1 ELSE 0 END) as low',
      ])
      .where('event.timestamp > :startDate', { startDate })
      .groupBy('DATE(event.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      dailyEventCounts: dailyEvents.map(e => ({ date: e.date, count: parseInt(e.count) })),
      topUsers: topUsers.map(u => ({ userEmail: u.userEmail, eventCount: parseInt(u.eventCount) })),
      topActions: topActions.map(a => ({ action: a.action, count: parseInt(a.count) })),
      riskTrends: riskTrends.map(r => ({
        date: r.date,
        critical: parseInt(r.critical),
        high: parseInt(r.high),
        medium: parseInt(r.medium),
        low: parseInt(r.low),
      })),
    };
  }
}