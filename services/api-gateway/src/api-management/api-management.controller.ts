/**
 * ApiManagementController - API management and rate limiting controls
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common/auth/jwt-auth.guard';
import { ApiManagementService } from './api-management.service';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPreview: string; // First few chars for identification
  clientId: string;
  clientName: string;
  permissions: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burst: number;
  };
  usage: {
    totalRequests: number;
    requestsThisMonth: number;
    lastUsed: Date;
  };
  status: 'active' | 'suspended' | 'revoked';
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or client identifier
  type: 'global' | 'per_client' | 'per_ip' | 'per_user';
  limits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiAnalytics {
  overview: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    averageResponseTime: number;
    totalClients: number;
    activeClients: number;
  };
  topEndpoints: Array<{
    endpoint: string;
    method: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  topClients: Array<{
    clientId: string;
    clientName: string;
    requestCount: number;
    errorRate: number;
    lastActivity: Date;
  }>;
  responseTimeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  errorBreakdown: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
  rateLimitMetrics: {
    totalBlocked: number;
    blockedByRule: Record<string, number>;
    topBlockedClients: Array<{
      clientId: string;
      blockedCount: number;
    }>;
  };
}

export interface ClientApplication {
  id: string;
  name: string;
  description: string;
  organization: string;
  contactEmail: string;
  type: 'internal' | 'partner' | 'public';
  status: 'active' | 'suspended' | 'pending_approval';
  apiKeys: string[];
  quotas: {
    requestsPerDay: number;
    requestsPerMonth: number;
    dataTransferLimitMB: number;
  };
  permissions: {
    allowedServices: string[];
    allowedEndpoints: string[];
    restrictedEndpoints: string[];
  };
  webhooks?: {
    url: string;
    events: string[];
    secret: string;
  };
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

@Controller('api-management')
@UseGuards(JwtAuthGuard)
export class ApiManagementController {
  private readonly logger = new Logger(ApiManagementController.name);

  constructor(private apiManagementService: ApiManagementService) {}

  /**
   * API Overview and Dashboard
   */
  @Get('overview')
  @RequireRoles('admin', 'api_manager')
  async getApiOverview(@Request() req: any) {
    try {
      const overview = await this.apiManagementService.getApiOverview();
      
      this.logger.log(`User ${req.user.sub} viewed API management overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get API overview:', error);
      throw new HttpException(
        'Failed to retrieve API overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * API Key Management
   */
  @Get('keys')
  @RequireRoles('admin', 'api_manager')
  async getApiKeys(
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ) {
    try {
      const keys = await this.apiManagementService.getApiKeys({
        clientId,
        status,
        limit,
        offset,
      });
      
      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      this.logger.error('Failed to get API keys:', error);
      throw new HttpException(
        'Failed to retrieve API keys',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('keys')
  @RequireRoles('admin', 'api_manager')
  async createApiKey(
    @Body() keyRequest: {
      name: string;
      clientId: string;
      permissions: string[];
      rateLimits: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        burst: number;
      };
      expiresAt?: Date;
      metadata?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      const apiKey = await this.apiManagementService.createApiKey(
        keyRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created API key for client ${keyRequest.clientId}`
      );
      
      return {
        success: true,
        data: apiKey,
        message: 'API key created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create API key:', error);
      throw new HttpException(
        'Failed to create API key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('keys/:keyId')
  @RequireRoles('admin', 'api_manager')
  async updateApiKey(
    @Param('keyId') keyId: string,
    @Body() update: Partial<ApiKey>,
    @Request() req: any,
  ) {
    try {
      const updatedKey = await this.apiManagementService.updateApiKey(
        keyId,
        update,
        req.user.sub
      );
      
      this.logger.log(`User ${req.user.sub} updated API key ${keyId}`);
      
      return {
        success: true,
        data: updatedKey,
        message: 'API key updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update API key:', error);
      throw new HttpException(
        'Failed to update API key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('keys/:keyId/revoke')
  @RequireRoles('admin', 'api_manager')
  async revokeApiKey(
    @Param('keyId') keyId: string,
    @Body() revocation: { reason: string },
    @Request() req: any,
  ) {
    try {
      await this.apiManagementService.revokeApiKey(keyId, revocation.reason, req.user.sub);
      
      this.logger.log(`User ${req.user.sub} revoked API key ${keyId}`);
      
      return {
        success: true,
        message: 'API key revoked successfully',
      };
    } catch (error) {
      this.logger.error('Failed to revoke API key:', error);
      throw new HttpException(
        'Failed to revoke API key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('keys/:keyId/regenerate')
  @RequireRoles('admin', 'api_manager')
  async regenerateApiKey(
    @Param('keyId') keyId: string,
    @Request() req: any,
  ) {
    try {
      const newKey = await this.apiManagementService.regenerateApiKey(keyId, req.user.sub);
      
      this.logger.log(`User ${req.user.sub} regenerated API key ${keyId}`);
      
      return {
        success: true,
        data: newKey,
        message: 'API key regenerated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to regenerate API key:', error);
      throw new HttpException(
        'Failed to regenerate API key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Rate Limiting Management
   */
  @Get('rate-limits')
  @RequireRoles('admin', 'api_manager')
  async getRateLimitRules(@Request() req: any) {
    try {
      const rules = await this.apiManagementService.getRateLimitRules();
      
      return {
        success: true,
        data: rules,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit rules:', error);
      throw new HttpException(
        'Failed to retrieve rate limit rules',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('rate-limits')
  @RequireRoles('admin', 'api_manager')
  async createRateLimitRule(
    @Body() rule: Omit<RateLimitRule, 'id' | 'createdAt' | 'updatedAt'>,
    @Request() req: any,
  ) {
    try {
      const createdRule = await this.apiManagementService.createRateLimitRule(
        rule,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created rate limit rule: ${rule.name}`
      );
      
      return {
        success: true,
        data: createdRule,
        message: 'Rate limit rule created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create rate limit rule:', error);
      throw new HttpException(
        'Failed to create rate limit rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('rate-limits/:ruleId')
  @RequireRoles('admin', 'api_manager')
  async updateRateLimitRule(
    @Param('ruleId') ruleId: string,
    @Body() update: Partial<RateLimitRule>,
    @Request() req: any,
  ) {
    try {
      const updatedRule = await this.apiManagementService.updateRateLimitRule(
        ruleId,
        update,
        req.user.sub
      );
      
      this.logger.log(`User ${req.user.sub} updated rate limit rule ${ruleId}`);
      
      return {
        success: true,
        data: updatedRule,
        message: 'Rate limit rule updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update rate limit rule:', error);
      throw new HttpException(
        'Failed to update rate limit rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('rate-limits/:ruleId')
  @RequireRoles('admin', 'api_manager')
  async deleteRateLimitRule(
    @Param('ruleId') ruleId: string,
    @Request() req: any,
  ) {
    try {
      await this.apiManagementService.deleteRateLimitRule(ruleId, req.user.sub);
      
      this.logger.log(`User ${req.user.sub} deleted rate limit rule ${ruleId}`);
      
      return {
        success: true,
        message: 'Rate limit rule deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete rate limit rule:', error);
      throw new HttpException(
        'Failed to delete rate limit rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Client Application Management
   */
  @Get('clients')
  @RequireRoles('admin', 'api_manager')
  async getClientApplications(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Request() req: any,
  ) {
    try {
      const clients = await this.apiManagementService.getClientApplications({
        status,
        type,
      });
      
      return {
        success: true,
        data: clients,
      };
    } catch (error) {
      this.logger.error('Failed to get client applications:', error);
      throw new HttpException(
        'Failed to retrieve client applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('clients')
  @RequireRoles('admin', 'api_manager')
  async createClientApplication(
    @Body() client: Omit<ClientApplication, 'id' | 'createdAt' | 'apiKeys'>,
    @Request() req: any,
  ) {
    try {
      const createdClient = await this.apiManagementService.createClientApplication(
        client,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created client application: ${client.name}`
      );
      
      return {
        success: true,
        data: createdClient,
        message: 'Client application created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create client application:', error);
      throw new HttpException(
        'Failed to create client application',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('clients/:clientId')
  @RequireRoles('admin', 'api_manager')
  async updateClientApplication(
    @Param('clientId') clientId: string,
    @Body() update: Partial<ClientApplication>,
    @Request() req: any,
  ) {
    try {
      const updatedClient = await this.apiManagementService.updateClientApplication(
        clientId,
        update,
        req.user.sub
      );
      
      this.logger.log(`User ${req.user.sub} updated client application ${clientId}`);
      
      return {
        success: true,
        data: updatedClient,
        message: 'Client application updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update client application:', error);
      throw new HttpException(
        'Failed to update client application',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('clients/:clientId/approve')
  @RequireRoles('admin')
  async approveClientApplication(
    @Param('clientId') clientId: string,
    @Request() req: any,
  ) {
    try {
      const approvedClient = await this.apiManagementService.approveClientApplication(
        clientId,
        req.user.sub
      );
      
      this.logger.log(`User ${req.user.sub} approved client application ${clientId}`);
      
      return {
        success: true,
        data: approvedClient,
        message: 'Client application approved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to approve client application:', error);
      throw new HttpException(
        'Failed to approve client application',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * API Analytics and Monitoring
   */
  @Get('analytics')
  @RequireRoles('admin', 'api_manager')
  async getApiAnalytics(
    @Query('period') period: string = '24h',
    @Query('clientId') clientId?: string,
    @Request() req: any,
  ) {
    try {
      const analytics = await this.apiManagementService.getApiAnalytics(period, clientId);
      
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error('Failed to get API analytics:', error);
      throw new HttpException(
        'Failed to retrieve API analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics/usage-trends')
  @RequireRoles('admin', 'api_manager')
  async getUsageTrends(
    @Query('metric') metric: string,
    @Query('period') period: string = '7d',
    @Query('granularity') granularity: string = 'hour',
    @Request() req: any,
  ) {
    try {
      const trends = await this.apiManagementService.getUsageTrends(
        metric,
        period,
        granularity
      );
      
      return {
        success: true,
        data: trends,
      };
    } catch (error) {
      this.logger.error('Failed to get usage trends:', error);
      throw new HttpException(
        'Failed to retrieve usage trends',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics/endpoint-performance')
  @RequireRoles('admin', 'api_manager')
  async getEndpointPerformance(
    @Query('period') period: string = '24h',
    @Query('limit') limit: number = 20,
    @Request() req: any,
  ) {
    try {
      const performance = await this.apiManagementService.getEndpointPerformance(
        period,
        limit
      );
      
      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      this.logger.error('Failed to get endpoint performance:', error);
      throw new HttpException(
        'Failed to retrieve endpoint performance',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * DDoS Protection and Security
   */
  @Get('security/threat-detection')
  @RequireRoles('admin', 'security_officer')
  async getThreatDetection(@Request() req: any) {
    try {
      const threats = await this.apiManagementService.getThreatDetection();
      
      return {
        success: true,
        data: threats,
      };
    } catch (error) {
      this.logger.error('Failed to get threat detection:', error);
      throw new HttpException(
        'Failed to retrieve threat detection',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('security/block-ip')
  @RequireRoles('admin', 'security_officer')
  async blockIpAddress(
    @Body() blockRequest: {
      ipAddress: string;
      reason: string;
      duration?: number; // minutes, 0 for permanent
    },
    @Request() req: any,
  ) {
    try {
      await this.apiManagementService.blockIpAddress(
        blockRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} blocked IP address ${blockRequest.ipAddress}`
      );
      
      return {
        success: true,
        message: 'IP address blocked successfully',
      };
    } catch (error) {
      this.logger.error('Failed to block IP address:', error);
      throw new HttpException(
        'Failed to block IP address',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('security/blocked-ips')
  @RequireRoles('admin', 'security_officer')
  async getBlockedIps(@Request() req: any) {
    try {
      const blockedIps = await this.apiManagementService.getBlockedIps();
      
      return {
        success: true,
        data: blockedIps,
      };
    } catch (error) {
      this.logger.error('Failed to get blocked IPs:', error);
      throw new HttpException(
        'Failed to retrieve blocked IPs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('security/blocked-ips/:ipAddress')
  @RequireRoles('admin', 'security_officer')
  async unblockIpAddress(
    @Param('ipAddress') ipAddress: string,
    @Request() req: any,
  ) {
    try {
      await this.apiManagementService.unblockIpAddress(ipAddress, req.user.sub);
      
      this.logger.log(`User ${req.user.sub} unblocked IP address ${ipAddress}`);
      
      return {
        success: true,
        message: 'IP address unblocked successfully',
      };
    } catch (error) {
      this.logger.error('Failed to unblock IP address:', error);
      throw new HttpException(
        'Failed to unblock IP address',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health Check and System Status
   */
  @Get('health')
  @RequireRoles('admin', 'api_manager')
  async getApiHealth(@Request() req: any) {
    try {
      const health = await this.apiManagementService.getApiHealth();
      
      return {
        success: true,
        data: health,
      };
    } catch (error) {
      this.logger.error('Failed to get API health:', error);
      throw new HttpException(
        'Failed to retrieve API health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}