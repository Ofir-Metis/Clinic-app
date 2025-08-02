/**
 * ConfigController - Configuration management and environment controls
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
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common/auth/jwt-auth.guard';
import { ConfigService } from './config.service';

export interface ConfigItem {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  environment: string;
  service?: string;
  category: string;
  description: string;
  isSecret: boolean;
  lastModified: Date;
  modifiedBy: string;
  version: number;
  tags: string[];
}

export interface Environment {
  id: string;
  name: string;
  displayName: string;
  type: 'development' | 'staging' | 'production' | 'test';
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  variables: Record<string, any>;
  deploymentConfig: {
    autoDeployment: boolean;
    approvalRequired: boolean;
    rollbackEnabled: boolean;
    healthCheckTimeout: number;
  };
  resources: {
    cpu: string;
    memory: string;
    storage: string;
    replicas: number;
  };
  createdAt: Date;
  createdBy: string;
}

export interface DeploymentRequest {
  environment: string;
  services: string[];
  version?: string;
  configChanges?: Array<{
    key: string;
    value: any;
    action: 'create' | 'update' | 'delete';
  }>;
  rollbackPlan?: {
    enabled: boolean;
    timeout: number;
    healthChecks: string[];
  };
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  rules: Array<{
    condition: string;
    percentage?: number;
    userSegments?: string[];
    startDate?: Date;
    endDate?: Date;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Record<string, any>;
  variables: Array<{
    key: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description: string;
  }>;
  createdBy: string;
  createdAt: Date;
}

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get configuration overview
   */
  @Get('overview')
  @RequireRoles('admin')
  async getConfigOverview(@Request() req: any) {
    try {
      const overview = await this.configService.getConfigOverview();
      
      this.logger.log(`Admin ${req.user.sub} viewed configuration overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get configuration overview:', error);
      throw new HttpException(
        'Failed to retrieve configuration overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Configuration Management
   */
  @Get('items')
  @RequireRoles('admin')
  async getConfigItems(
    @Query('environment') environment?: string,
    @Query('service') service?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Request() req: any,
  ) {
    try {
      const items = await this.configService.getConfigItems({
        environment,
        service,
        category,
        search,
      });
      
      return {
        success: true,
        data: items,
      };
    } catch (error) {
      this.logger.error('Failed to get configuration items:', error);
      throw new HttpException(
        'Failed to retrieve configuration items',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('items')
  @RequireRoles('admin')
  async createConfigItem(
    @Body() item: Omit<ConfigItem, 'id' | 'lastModified' | 'modifiedBy' | 'version'>,
    @Request() req: any,
  ) {
    try {
      const createdItem = await this.configService.createConfigItem(
        item,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} created config item: ${item.key} in ${item.environment}`
      );
      
      return {
        success: true,
        data: createdItem,
        message: 'Configuration item created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create configuration item:', error);
      throw new HttpException(
        'Failed to create configuration item',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('items/:itemId')
  @RequireRoles('admin')
  async updateConfigItem(
    @Param('itemId') itemId: string,
    @Body() item: Partial<ConfigItem>,
    @Request() req: any,
  ) {
    try {
      const updatedItem = await this.configService.updateConfigItem(
        itemId,
        item,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} updated config item ${itemId}`);
      
      return {
        success: true,
        data: updatedItem,
        message: 'Configuration item updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update configuration item:', error);
      throw new HttpException(
        'Failed to update configuration item',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('items/:itemId')
  @RequireRoles('admin')
  async deleteConfigItem(
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    try {
      await this.configService.deleteConfigItem(itemId, req.user.sub);
      
      this.logger.log(`Admin ${req.user.sub} deleted config item ${itemId}`);
      
      return {
        success: true,
        message: 'Configuration item deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete configuration item:', error);
      throw new HttpException(
        'Failed to delete configuration item',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Environment Management
   */
  @Get('environments')
  @RequireRoles('admin')
  async getEnvironments(@Request() req: any) {
    try {
      const environments = await this.configService.getEnvironments();
      
      return {
        success: true,
        data: environments,
      };
    } catch (error) {
      this.logger.error('Failed to get environments:', error);
      throw new HttpException(
        'Failed to retrieve environments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('environments')
  @RequireRoles('admin')
  async createEnvironment(
    @Body() environment: Omit<Environment, 'id' | 'createdAt' | 'createdBy'>,
    @Request() req: any,
  ) {
    try {
      const createdEnvironment = await this.configService.createEnvironment(
        environment,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} created environment: ${environment.name}`
      );
      
      return {
        success: true,
        data: createdEnvironment,
        message: 'Environment created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create environment:', error);
      throw new HttpException(
        'Failed to create environment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('environments/:envId')
  @RequireRoles('admin')
  async updateEnvironment(
    @Param('envId') envId: string,
    @Body() environment: Partial<Environment>,
    @Request() req: any,
  ) {
    try {
      const updatedEnvironment = await this.configService.updateEnvironment(
        envId,
        environment,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} updated environment ${envId}`);
      
      return {
        success: true,
        data: updatedEnvironment,
        message: 'Environment updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update environment:', error);
      throw new HttpException(
        'Failed to update environment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Deployment Management
   */
  @Post('deploy')
  @RequireRoles('admin')
  async deploy(
    @Body() deploymentRequest: DeploymentRequest,
    @Request() req: any,
  ) {
    try {
      const deployment = await this.configService.deploy(
        deploymentRequest,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} initiated deployment to ${deploymentRequest.environment}`
      );
      
      return {
        success: true,
        data: deployment,
        message: 'Deployment initiated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to initiate deployment:', error);
      throw new HttpException(
        'Failed to initiate deployment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('deployments')
  @RequireRoles('admin')
  async getDeployments(
    @Query('environment') environment?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @Request() req: any,
  ) {
    try {
      const deployments = await this.configService.getDeployments({
        environment,
        status,
        limit,
      });
      
      return {
        success: true,
        data: deployments,
      };
    } catch (error) {
      this.logger.error('Failed to get deployments:', error);
      throw new HttpException(
        'Failed to retrieve deployments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('deployments/:deploymentId/rollback')
  @RequireRoles('admin')
  async rollback(
    @Param('deploymentId') deploymentId: string,
    @Body() rollbackOptions: { reason: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.configService.rollback(
        deploymentId,
        rollbackOptions,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} initiated rollback for deployment ${deploymentId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Rollback initiated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to initiate rollback:', error);
      throw new HttpException(
        'Failed to initiate rollback',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Feature Flags Management
   */
  @Get('feature-flags')
  @RequireRoles('admin')
  async getFeatureFlags(
    @Query('environment') environment?: string,
    @Request() req: any,
  ) {
    try {
      const featureFlags = await this.configService.getFeatureFlags(environment);
      
      return {
        success: true,
        data: featureFlags,
      };
    } catch (error) {
      this.logger.error('Failed to get feature flags:', error);
      throw new HttpException(
        'Failed to retrieve feature flags',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('feature-flags')
  @RequireRoles('admin')
  async createFeatureFlag(
    @Body() featureFlag: Omit<FeatureFlag, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>,
    @Request() req: any,
  ) {
    try {
      const createdFlag = await this.configService.createFeatureFlag(
        featureFlag,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} created feature flag: ${featureFlag.key}`
      );
      
      return {
        success: true,
        data: createdFlag,
        message: 'Feature flag created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create feature flag:', error);
      throw new HttpException(
        'Failed to create feature flag',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('feature-flags/:flagId/toggle')
  @RequireRoles('admin')
  async toggleFeatureFlag(
    @Param('flagId') flagId: string,
    @Body() toggleData: { enabled: boolean; environment?: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.configService.toggleFeatureFlag(
        flagId,
        toggleData,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} ${toggleData.enabled ? 'enabled' : 'disabled'} feature flag ${flagId}`
      );
      
      return {
        success: true,
        data: result,
        message: `Feature flag ${toggleData.enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      this.logger.error('Failed to toggle feature flag:', error);
      throw new HttpException(
        'Failed to toggle feature flag',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Configuration Templates
   */
  @Get('templates')
  @RequireRoles('admin')
  async getConfigTemplates(@Request() req: any) {
    try {
      const templates = await this.configService.getConfigTemplates();
      
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      this.logger.error('Failed to get configuration templates:', error);
      throw new HttpException(
        'Failed to retrieve configuration templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('templates')
  @RequireRoles('admin')
  async createConfigTemplate(
    @Body() template: Omit<ConfigTemplate, 'id' | 'createdAt' | 'createdBy'>,
    @Request() req: any,
  ) {
    try {
      const createdTemplate = await this.configService.createConfigTemplate(
        template,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} created config template: ${template.name}`
      );
      
      return {
        success: true,
        data: createdTemplate,
        message: 'Configuration template created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create configuration template:', error);
      throw new HttpException(
        'Failed to create configuration template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('templates/:templateId/apply')
  @RequireRoles('admin')
  async applyConfigTemplate(
    @Param('templateId') templateId: string,
    @Body() applyData: {
      environment: string;
      variables: Record<string, any>;
      services?: string[];
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.configService.applyConfigTemplate(
        templateId,
        applyData,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} applied config template ${templateId} to ${applyData.environment}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Configuration template applied successfully',
      };
    } catch (error) {
      this.logger.error('Failed to apply configuration template:', error);
      throw new HttpException(
        'Failed to apply configuration template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Configuration Validation and Drift Detection
   */
  @Post('validate')
  @RequireRoles('admin')
  async validateConfiguration(
    @Body() validationRequest: {
      environment: string;
      services?: string[];
    },
    @Request() req: any,
  ) {
    try {
      const validation = await this.configService.validateConfiguration(
        validationRequest
      );
      
      this.logger.log(
        `Admin ${req.user.sub} validated configuration for ${validationRequest.environment}`
      );
      
      return {
        success: true,
        data: validation,
        message: 'Configuration validation completed',
      };
    } catch (error) {
      this.logger.error('Failed to validate configuration:', error);
      throw new HttpException(
        'Failed to validate configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('drift-detection')
  @RequireRoles('admin')
  async detectConfigurationDrift(
    @Query('environment') environment?: string,
    @Request() req: any,
  ) {
    try {
      const drift = await this.configService.detectConfigurationDrift(environment);
      
      return {
        success: true,
        data: drift,
      };
    } catch (error) {
      this.logger.error('Failed to detect configuration drift:', error);
      throw new HttpException(
        'Failed to detect configuration drift',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Configuration History and Audit
   */
  @Get('history')
  @RequireRoles('admin')
  async getConfigurationHistory(
    @Query('key') key?: string,
    @Query('environment') environment?: string,
    @Query('limit') limit: number = 100,
    @Request() req: any,
  ) {
    try {
      const history = await this.configService.getConfigurationHistory({
        key,
        environment,
        limit,
      });
      
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      this.logger.error('Failed to get configuration history:', error);
      throw new HttpException(
        'Failed to retrieve configuration history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('restore/:historyId')
  @RequireRoles('admin')
  async restoreConfiguration(
    @Param('historyId') historyId: string,
    @Body() restoreOptions: { reason: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.configService.restoreConfiguration(
        historyId,
        restoreOptions,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} restored configuration from history ${historyId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Configuration restored successfully',
      };
    } catch (error) {
      this.logger.error('Failed to restore configuration:', error);
      throw new HttpException(
        'Failed to restore configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}