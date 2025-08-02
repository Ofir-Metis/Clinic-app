/**
 * ApiManagementService - Business logic for API management and rate limiting
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface ApiOverview {
  totalApiKeys: number;
  activeApiKeys: number;
  totalClients: number;
  activeClients: number;
  totalRequests: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  rateLimitStatus: {
    totalRules: number;
    activeRules: number;
    blockedRequests: number;
    averageBlockRate: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  topClients: Array<{
    id: string;
    name: string;
    requestCount: number;
    lastActivity: Date;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

@Injectable()
export class ApiManagementService {
  private readonly logger = new Logger(ApiManagementService.name);

  // Mock data stores (in production, these would be database operations)
  private apiKeys = new Map();
  private rateLimitRules = new Map();
  private clientApplications = new Map();
  private blockedIps = new Map();
  private analyticsData = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock API keys
    const mockApiKeys = [
      {
        id: 'key_1',
        name: 'Production API Key',
        keyHash: this.hashApiKey('clinic_prod_abc123xyz'),
        keyPreview: 'clinic_prod_abc123...',
        clientId: 'client_1',
        clientName: 'Mobile App',
        permissions: ['read:patients', 'write:appointments', 'read:files'],
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 5000,
          requestsPerDay: 100000,
          burst: 200,
        },
        usage: {
          totalRequests: 2456789,
          requestsThisMonth: 125000,
          lastUsed: new Date(Date.now() - 2 * 60 * 1000),
        },
        status: 'active',
        createdAt: new Date('2024-01-15'),
        createdBy: 'admin@clinic.com',
        metadata: { environment: 'production' },
      },
      {
        id: 'key_2',
        name: 'Partner Integration Key',
        keyHash: this.hashApiKey('clinic_partner_def456abc'),
        keyPreview: 'clinic_partner_def456...',
        clientId: 'client_2',
        clientName: 'Insurance Provider Portal',
        permissions: ['read:patients', 'read:appointments'],
        rateLimits: {
          requestsPerMinute: 50,
          requestsPerHour: 2000,
          requestsPerDay: 40000,
          burst: 100,
        },
        usage: {
          totalRequests: 567890,
          requestsThisMonth: 45000,
          lastUsed: new Date(Date.now() - 15 * 60 * 1000),
        },
        status: 'active',
        createdAt: new Date('2024-02-01'),
        createdBy: 'admin@clinic.com',
        metadata: { environment: 'production', partner: 'HealthInsure Corp' },
      },
    ];

    mockApiKeys.forEach(key => this.apiKeys.set(key.id, key));

    // Mock rate limit rules
    const mockRules = [
      {
        id: 'rule_1',
        name: 'Global Rate Limit',
        pattern: '*',
        type: 'global',
        limits: {
          requestsPerSecond: 1000,
          requestsPerMinute: 50000,
          requestsPerHour: 2000000,
          requestsPerDay: 40000000,
          burstLimit: 2000,
        },
        priority: 1,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'rule_2',
        name: 'Patient Endpoint Protection',
        pattern: '/patients/*',
        type: 'per_client',
        limits: {
          requestsPerSecond: 10,
          requestsPerMinute: 500,
          requestsPerHour: 20000,
          requestsPerDay: 400000,
          burstLimit: 50,
        },
        priority: 10,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'rule_3',
        name: 'Authentication Endpoint Protection',
        pattern: '/auth/*',
        type: 'per_ip',
        limits: {
          requestsPerSecond: 5,
          requestsPerMinute: 20,
          requestsPerHour: 100,
          requestsPerDay: 1000,
          burstLimit: 10,
        },
        priority: 20,
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    mockRules.forEach(rule => this.rateLimitRules.set(rule.id, rule));

    // Mock client applications
    const mockClients = [
      {
        id: 'client_1',
        name: 'Mobile App',
        description: 'Official clinic mobile application',
        organization: 'Clinic Internal',
        contactEmail: 'mobile-team@clinic.com',
        type: 'internal',
        status: 'active',
        apiKeys: ['key_1'],
        quotas: {
          requestsPerDay: 100000,
          requestsPerMonth: 3000000,
          dataTransferLimitMB: 10240,
        },
        permissions: {
          allowedServices: ['auth', 'patients', 'appointments', 'files', 'notifications'],
          allowedEndpoints: ['*'],
          restrictedEndpoints: ['/admin/*'],
        },
        createdAt: new Date('2024-01-15'),
        approvedAt: new Date('2024-01-15'),
        approvedBy: 'admin@clinic.com',
      },
      {
        id: 'client_2',
        name: 'Insurance Provider Portal',
        description: 'Partner integration for insurance verification',
        organization: 'HealthInsure Corp',
        contactEmail: 'api-team@healthinsure.com',
        type: 'partner',
        status: 'active',
        apiKeys: ['key_2'],
        quotas: {
          requestsPerDay: 40000,
          requestsPerMonth: 1200000,
          dataTransferLimitMB: 5120,
        },
        permissions: {
          allowedServices: ['patients', 'appointments'],
          allowedEndpoints: ['/patients/verify', '/appointments/list'],
          restrictedEndpoints: ['/patients/create', '/patients/update', '/admin/*'],
        },
        webhooks: {
          url: 'https://api.healthinsure.com/webhooks/clinic',
          events: ['appointment.created', 'appointment.updated'],
          secret: 'whsec_abc123def456',
        },
        createdAt: new Date('2024-02-01'),
        approvedAt: new Date('2024-02-02'),
        approvedBy: 'admin@clinic.com',
      },
    ];

    mockClients.forEach(client => this.clientApplications.set(client.id, client));

    // Mock blocked IPs
    const mockBlockedIps = [
      {
        ipAddress: '192.168.1.100',
        reason: 'Suspicious activity - multiple failed auth attempts',
        blockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        blockedBy: 'system',
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
        attempts: 15,
      },
      {
        ipAddress: '10.0.0.50',
        reason: 'Rate limit exceeded repeatedly',
        blockedAt: new Date(Date.now() - 30 * 60 * 1000),
        blockedBy: 'admin@clinic.com',
        expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000),
        attempts: 5,
      },
    ];

    mockBlockedIps.forEach(ip => this.blockedIps.set(ip.ipAddress, ip));
  }

  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private generateApiKey(): string {
    return `clinic_${crypto.randomBytes(16).toString('hex')}`;
  }

  async getApiOverview(): Promise<ApiOverview> {
    const totalApiKeys = this.apiKeys.size;
    const activeApiKeys = Array.from(this.apiKeys.values()).filter(key => key.status === 'active').length;
    const totalClients = this.clientApplications.size;
    const activeClients = Array.from(this.clientApplications.values()).filter(client => client.status === 'active').length;
    const totalRules = this.rateLimitRules.size;
    const activeRules = Array.from(this.rateLimitRules.values()).filter(rule => rule.enabled).length;

    return {
      totalApiKeys,
      activeApiKeys,
      totalClients,
      activeClients,
      totalRequests: {
        today: 125000,
        thisWeek: 890000,
        thisMonth: 3200000,
      },
      rateLimitStatus: {
        totalRules,
        activeRules,
        blockedRequests: 2456,
        averageBlockRate: 0.08,
      },
      systemHealth: {
        uptime: 99.97,
        responseTime: 145,
        throughput: 2500,
        errorRate: 0.03,
      },
      topClients: Array.from(this.clientApplications.values())
        .map(client => ({
          id: client.id,
          name: client.name,
          requestCount: client.name === 'Mobile App' ? 125000 : 45000,
          lastActivity: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        }))
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 5),
      recentActivity: [
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          action: 'API Key Created',
          details: 'New API key created for Testing Environment',
          severity: 'info',
        },
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          action: 'Rate Limit Triggered',
          details: 'Client "Insurance Provider Portal" hit rate limit',
          severity: 'warning',
        },
        {
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          action: 'IP Blocked',
          details: 'IP 192.168.1.100 blocked for suspicious activity',
          severity: 'error',
        },
      ],
    };
  }

  async getApiKeys(filters: any): Promise<any> {
    let keys = Array.from(this.apiKeys.values());

    if (filters.clientId) {
      keys = keys.filter(key => key.clientId === filters.clientId);
    }

    if (filters.status) {
      keys = keys.filter(key => key.status === filters.status);
    }

    return {
      keys: keys.slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50)),
      total: keys.length,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(keys.length / (filters.limit || 50)),
    };
  }

  async createApiKey(keyRequest: any, userId: string): Promise<any> {
    const apiKey = this.generateApiKey();
    const keyData = {
      id: `key_${Date.now()}`,
      name: keyRequest.name,
      keyHash: this.hashApiKey(apiKey),
      keyPreview: `${apiKey.substring(0, 20)}...`,
      clientId: keyRequest.clientId,
      clientName: this.clientApplications.get(keyRequest.clientId)?.name || 'Unknown Client',
      permissions: keyRequest.permissions,
      rateLimits: keyRequest.rateLimits,
      usage: {
        totalRequests: 0,
        requestsThisMonth: 0,
        lastUsed: null,
      },
      status: 'active',
      createdAt: new Date(),
      createdBy: userId,
      expiresAt: keyRequest.expiresAt,
      metadata: keyRequest.metadata || {},
    };

    this.apiKeys.set(keyData.id, keyData);

    return {
      ...keyData,
      apiKey, // Only return the plain key on creation
    };
  }

  async updateApiKey(keyId: string, update: any, userId: string): Promise<any> {
    const key = this.apiKeys.get(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    const updatedKey = {
      ...key,
      ...update,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.apiKeys.set(keyId, updatedKey);
    return updatedKey;
  }

  async revokeApiKey(keyId: string, reason: string, userId: string): Promise<void> {
    const key = this.apiKeys.get(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    key.status = 'revoked';
    key.revokedAt = new Date();
    key.revokedBy = userId;
    key.revocationReason = reason;

    this.apiKeys.set(keyId, key);
  }

  async regenerateApiKey(keyId: string, userId: string): Promise<any> {
    const key = this.apiKeys.get(keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    const newApiKey = this.generateApiKey();
    key.keyHash = this.hashApiKey(newApiKey);
    key.keyPreview = `${newApiKey.substring(0, 20)}...`;
    key.regeneratedAt = new Date();
    key.regeneratedBy = userId;

    this.apiKeys.set(keyId, key);

    return {
      ...key,
      apiKey: newApiKey,
    };
  }

  async getRateLimitRules(): Promise<any[]> {
    return Array.from(this.rateLimitRules.values()).sort((a, b) => a.priority - b.priority);
  }

  async createRateLimitRule(rule: any, userId: string): Promise<any> {
    const ruleData = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    this.rateLimitRules.set(ruleData.id, ruleData);
    return ruleData;
  }

  async updateRateLimitRule(ruleId: string, update: any, userId: string): Promise<any> {
    const rule = this.rateLimitRules.get(ruleId);
    if (!rule) {
      throw new Error('Rate limit rule not found');
    }

    const updatedRule = {
      ...rule,
      ...update,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.rateLimitRules.set(ruleId, updatedRule);
    return updatedRule;
  }

  async deleteRateLimitRule(ruleId: string, userId: string): Promise<void> {
    const rule = this.rateLimitRules.get(ruleId);
    if (!rule) {
      throw new Error('Rate limit rule not found');
    }

    this.rateLimitRules.delete(ruleId);
  }

  async getClientApplications(filters: any): Promise<any[]> {
    let clients = Array.from(this.clientApplications.values());

    if (filters.status) {
      clients = clients.filter(client => client.status === filters.status);
    }

    if (filters.type) {
      clients = clients.filter(client => client.type === filters.type);
    }

    return clients;
  }

  async createClientApplication(client: any, userId: string): Promise<any> {
    const clientData = {
      ...client,
      id: `client_${Date.now()}`,
      apiKeys: [],
      createdAt: new Date(),
      status: client.type === 'internal' ? 'active' : 'pending_approval',
    };

    this.clientApplications.set(clientData.id, clientData);
    return clientData;
  }

  async updateClientApplication(clientId: string, update: any, userId: string): Promise<any> {
    const client = this.clientApplications.get(clientId);
    if (!client) {
      throw new Error('Client application not found');
    }

    const updatedClient = {
      ...client,
      ...update,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.clientApplications.set(clientId, updatedClient);
    return updatedClient;
  }

  async approveClientApplication(clientId: string, userId: string): Promise<any> {
    const client = this.clientApplications.get(clientId);
    if (!client) {
      throw new Error('Client application not found');
    }

    client.status = 'active';
    client.approvedAt = new Date();
    client.approvedBy = userId;

    this.clientApplications.set(clientId, client);
    return client;
  }

  async getApiAnalytics(period: string, clientId?: string): Promise<any> {
    // Mock analytics data
    return {
      overview: {
        totalRequests: 125000,
        successfulRequests: 123750,
        failedRequests: 1250,
        rateLimitedRequests: 456,
        averageResponseTime: 145,
        totalClients: this.clientApplications.size,
        activeClients: Array.from(this.clientApplications.values()).filter(c => c.status === 'active').length,
      },
      topEndpoints: [
        {
          endpoint: '/patients',
          method: 'GET',
          requestCount: 45000,
          averageResponseTime: 120,
          errorRate: 0.02,
        },
        {
          endpoint: '/appointments',
          method: 'GET',
          requestCount: 38000,
          averageResponseTime: 135,
          errorRate: 0.01,
        },
        {
          endpoint: '/auth/login',
          method: 'POST',
          requestCount: 15000,
          averageResponseTime: 200,
          errorRate: 0.05,
        },
      ],
      topClients: Array.from(this.clientApplications.values()).map(client => ({
        clientId: client.id,
        clientName: client.name,
        requestCount: client.name === 'Mobile App' ? 85000 : 40000,
        errorRate: Math.random() * 0.05,
        lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      })),
      responseTimeDistribution: [
        { range: '0-100ms', count: 62500, percentage: 50 },
        { range: '100-200ms', count: 37500, percentage: 30 },
        { range: '200-500ms', count: 18750, percentage: 15 },
        { range: '500ms+', count: 6250, percentage: 5 },
      ],
      errorBreakdown: [
        { statusCode: 400, count: 750, percentage: 60 },
        { statusCode: 401, count: 250, percentage: 20 },
        { statusCode: 403, count: 125, percentage: 10 },
        { statusCode: 404, count: 75, percentage: 6 },
        { statusCode: 500, count: 50, percentage: 4 },
      ],
      rateLimitMetrics: {
        totalBlocked: 456,
        blockedByRule: {
          'Global Rate Limit': 200,
          'Patient Endpoint Protection': 150,
          'Authentication Endpoint Protection': 106,
        },
        topBlockedClients: [
          { clientId: 'client_2', blockedCount: 200 },
          { clientId: 'client_1', blockedCount: 100 },
        ],
      },
    };
  }

  async getUsageTrends(metric: string, period: string, granularity: string): Promise<any> {
    // Mock trend data
    const dataPoints = granularity === 'hour' ? 24 : 7;
    const trends = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * (granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
      trends.push({
        timestamp,
        value: Math.floor(Math.random() * 10000) + 5000,
        metric,
      });
    }

    return trends;
  }

  async getEndpointPerformance(period: string, limit: number): Promise<any> {
    // Mock endpoint performance data
    return [
      {
        endpoint: '/patients',
        method: 'GET',
        requestCount: 45000,
        averageResponseTime: 120,
        p95ResponseTime: 250,
        p99ResponseTime: 500,
        errorRate: 0.02,
        successRate: 99.98,
      },
      {
        endpoint: '/appointments',
        method: 'POST',
        requestCount: 25000,
        averageResponseTime: 180,
        p95ResponseTime: 350,
        p99ResponseTime: 750,
        errorRate: 0.03,
        successRate: 99.97,
      },
      {
        endpoint: '/files/upload',
        method: 'POST',
        requestCount: 8000,
        averageResponseTime: 2500,
        p95ResponseTime: 5000,
        p99ResponseTime: 10000,
        errorRate: 0.01,
        successRate: 99.99,
      },
    ].slice(0, limit);
  }

  async getThreatDetection(): Promise<any> {
    return {
      overview: {
        threatsDetected: 15,
        suspiciousIps: 8,
        blockedIps: this.blockedIps.size,
        anomalousTraffic: 3,
      },
      recentThreats: [
        {
          id: 'threat_1',
          type: 'Brute Force Attack',
          sourceIp: '192.168.1.100',
          detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'high',
          status: 'blocked',
          details: 'Multiple failed authentication attempts',
        },
        {
          id: 'threat_2',
          type: 'Rate Limit Abuse',
          sourceIp: '10.0.0.50',
          detectedAt: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'medium',
          status: 'monitoring',
          details: 'Consistent rate limit violations',
        },
      ],
      trafficPatterns: {
        normal: 85,
        suspicious: 12,
        malicious: 3,
      },
    };
  }

  async blockIpAddress(blockRequest: any, userId: string): Promise<void> {
    const blockData = {
      ipAddress: blockRequest.ipAddress,
      reason: blockRequest.reason,
      blockedAt: new Date(),
      blockedBy: userId,
      expiresAt: blockRequest.duration ? new Date(Date.now() + blockRequest.duration * 60 * 1000) : null,
      attempts: 1,
    };

    this.blockedIps.set(blockRequest.ipAddress, blockData);
  }

  async getBlockedIps(): Promise<any[]> {
    return Array.from(this.blockedIps.values()).sort((a, b) => 
      new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()
    );
  }

  async unblockIpAddress(ipAddress: string, userId: string): Promise<void> {
    const blocked = this.blockedIps.get(ipAddress);
    if (!blocked) {
      throw new Error('IP address not found in blocked list');
    }

    blocked.unblockedAt = new Date();
    blocked.unblockedBy = userId;
    
    this.blockedIps.delete(ipAddress);
  }

  async getApiHealth(): Promise<any> {
    return {
      status: 'healthy',
      uptime: 99.97,
      services: {
        'rate-limiter': { status: 'healthy', responseTime: 5 },
        'api-gateway': { status: 'healthy', responseTime: 12 },
        'authentication': { status: 'healthy', responseTime: 8 },
        'analytics': { status: 'healthy', responseTime: 15 },
      },
      metrics: {
        requestsPerSecond: 2500,
        averageResponseTime: 145,
        errorRate: 0.03,
        memoryUsage: 68,
        cpuUsage: 45,
      },
      lastHealthCheck: new Date(),
    };
  }
}