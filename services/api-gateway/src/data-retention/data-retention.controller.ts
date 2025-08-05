import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataRetentionService, RetentionPolicy, RetentionExecutionResult } from './data-retention.service';
import { JwtAuthGuard } from '@clinic/common/auth';
import { RolesGuard, Roles } from '@clinic/common/auth';
import { StructuredLoggerService } from '@clinic/common/logging';

/**
 * Data Retention Controller
 * 
 * Provides REST API endpoints for managing healthcare data retention and archival policies.
 * Supports HIPAA-compliant data lifecycle management with automated cleanup and archival.
 */

export class CreateRetentionPolicyDto {
  id: string;
  name: string;
  description: string;
  dataType: string;
  retentionPeriod: number;
  archivalPeriod: number;
  isEnabled: boolean;
  complianceRequirements: string[];
  configuration: any;
}

export class UpdateRetentionPolicyDto {
  name?: string;
  description?: string;
  retentionPeriod?: number;
  archivalPeriod?: number;
  isEnabled?: boolean;
  complianceRequirements?: string[];
  configuration?: any;
}

@ApiTags('data-retention')
@ApiBearerAuth()
@Controller('data-retention')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataRetentionController {
  private readonly logger = new Logger(DataRetentionController.name);
  
  constructor(
    private readonly dataRetentionService: DataRetentionService,
    private readonly structuredLogger: StructuredLoggerService
  ) {}
  
  /**
   * Get all retention policies
   */
  @Get('policies')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ 
    summary: 'Get all retention policies',
    description: 'Returns all configured data retention policies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of retention policies',
    type: [Object]
  })
  async getRetentionPolicies() {
    try {
      const policies = this.dataRetentionService.getRetentionPolicies();
      
      this.structuredLogger.info('Retention policies retrieved', {
        operation: 'get_retention_policies',
        policyCount: policies.length
      });
      
      return {
        success: true,
        data: policies,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to get retention policies', error);
      throw new HttpException(
        'Failed to retrieve retention policies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get specific retention policy
   */
  @Get('policies/:policyId')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ 
    summary: 'Get retention policy',
    description: 'Returns details of a specific retention policy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retention policy details',
    type: Object
  })
  async getRetentionPolicy(@Param('policyId') policyId: string) {
    try {
      const policy = this.dataRetentionService.getRetentionPolicy(policyId);
      
      if (!policy) {
        throw new HttpException(
          `Retention policy not found: ${policyId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: policy,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to get retention policy', error);
      throw new HttpException(
        'Failed to retrieve retention policy',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Create new retention policy
   */
  @Post('policies')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Create retention policy',
    description: 'Creates a new data retention policy'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Policy created successfully'
  })
  async createRetentionPolicy(@Body() createDto: CreateRetentionPolicyDto) {
    try {
      // Validate required fields
      this.validateRetentionPolicy(createDto);
      
      await this.dataRetentionService.createRetentionPolicy(createDto);
      
      this.structuredLogger.info('Retention policy created', {
        operation: 'create_retention_policy',
        policyId: createDto.id,
        dataType: createDto.dataType,
        retentionPeriod: createDto.retentionPeriod
      });
      
      return {
        success: true,
        message: 'Retention policy created successfully',
        policyId: createDto.id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to create retention policy', error);
      throw new HttpException(
        'Failed to create retention policy',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Update retention policy
   */
  @Put('policies/:policyId')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update retention policy',
    description: 'Updates an existing retention policy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Policy updated successfully'
  })
  async updateRetentionPolicy(
    @Param('policyId') policyId: string,
    @Body() updateDto: UpdateRetentionPolicyDto
  ) {
    try {
      await this.dataRetentionService.updateRetentionPolicy(policyId, updateDto);
      
      this.structuredLogger.info('Retention policy updated', {
        operation: 'update_retention_policy',
        policyId,
        updates: Object.keys(updateDto)
      });
      
      return {
        success: true,
        message: 'Retention policy updated successfully',
        policyId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Retention policy not found: ${policyId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.logger.error('Failed to update retention policy', error);
      throw new HttpException(
        'Failed to update retention policy',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Execute retention policies manually
   */
  @Post('execute')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Execute retention policies',
    description: 'Manually triggers execution of all enabled retention policies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retention policies executed',
    type: [Object]
  })
  async executeRetentionPolicies() {
    try {
      this.structuredLogger.info('Manual retention policy execution requested', {
        operation: 'manual_execute_retention_policies'
      });
      
      const results = await this.dataRetentionService.executeRetentionPolicies();
      
      this.structuredLogger.info('Manual retention policy execution completed', {
        operation: 'manual_execute_retention_policies_complete',
        totalPolicies: results.length,
        successfulPolicies: results.filter(r => r.status === 'success').length,
        totalProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
        totalArchived: results.reduce((sum, r) => sum + r.recordsArchived, 0),
        totalDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0)
      });
      
      return {
        success: true,
        data: results,
        summary: {
          totalPolicies: results.length,
          successfulPolicies: results.filter(r => r.status === 'success').length,
          failedPolicies: results.filter(r => r.status === 'failed').length,
          totalRecordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
          totalRecordsArchived: results.reduce((sum, r) => sum + r.recordsArchived, 0),
          totalRecordsDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0)
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to execute retention policies', error);
      throw new HttpException(
        'Failed to execute retention policies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Execute specific retention policy
   */
  @Post('execute/:policyId')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Execute specific retention policy',
    description: 'Manually triggers execution of a specific retention policy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retention policy executed',
    type: Object
  })
  async executeSpecificRetentionPolicy(@Param('policyId') policyId: string) {
    try {
      const policy = this.dataRetentionService.getRetentionPolicy(policyId);
      
      if (!policy) {
        throw new HttpException(
          `Retention policy not found: ${policyId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      if (!policy.isEnabled) {
        throw new HttpException(
          `Retention policy is disabled: ${policyId}`,
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.structuredLogger.info('Manual execution of specific retention policy requested', {
        operation: 'manual_execute_specific_retention_policy',
        policyId,
        policyName: policy.name
      });
      
      const result = await this.dataRetentionService.executeSinglePolicy(policy);
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to execute specific retention policy', error);
      throw new HttpException(
        'Failed to execute retention policy',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get retention statistics
   */
  @Get('statistics')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ 
    summary: 'Get retention statistics',
    description: 'Returns statistics about data retention and archival operations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retention statistics',
    type: Object
  })
  async getRetentionStatistics() {
    try {
      const statistics = await this.dataRetentionService.getRetentionStatistics();
      
      return {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to get retention statistics', error);
      throw new HttpException(
        'Failed to retrieve retention statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get compliance status
   */
  @Get('compliance-status')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ 
    summary: 'Get compliance status',
    description: 'Returns HIPAA and regulatory compliance status for data retention'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Compliance status',
    type: Object
  })
  async getComplianceStatus() {
    try {
      const policies = this.dataRetentionService.getRetentionPolicies();
      
      const complianceStatus = {
        overallStatus: 'compliant',
        hipaaCompliant: true,
        policies: policies.length,
        activePolicies: policies.filter(p => p.isEnabled).length,
        complianceRequirements: {},
        lastAudit: new Date(),
        issues: []
      };
      
      // Check compliance requirements
      const allRequirements = new Set<string>();
      policies.forEach(policy => {
        policy.complianceRequirements.forEach(req => allRequirements.add(req));
      });
      
      Array.from(allRequirements).forEach(requirement => {
        const policiesForRequirement = policies.filter(p => 
          p.complianceRequirements.includes(requirement) && p.isEnabled
        );
        
        complianceStatus.complianceRequirements[requirement] = {
          covered: policiesForRequirement.length > 0,
          policies: policiesForRequirement.length,
          status: policiesForRequirement.length > 0 ? 'compliant' : 'non-compliant'
        };
        
        if (policiesForRequirement.length === 0) {
          complianceStatus.issues.push(`No active policies for ${requirement}`);
          complianceStatus.overallStatus = 'non-compliant';
          
          if (requirement === 'HIPAA') {
            complianceStatus.hipaaCompliant = false;
          }
        }
      });
      
      this.structuredLogger.info('Compliance status retrieved', {
        operation: 'get_compliance_status',
        overallStatus: complianceStatus.overallStatus,
        hipaaCompliant: complianceStatus.hipaaCompliant,
        issueCount: complianceStatus.issues.length
      });
      
      return {
        success: true,
        data: complianceStatus,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to get compliance status', error);
      throw new HttpException(
        'Failed to retrieve compliance status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Preview retention policy impact
   */
  @Post('policies/:policyId/preview')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ 
    summary: 'Preview retention policy impact',
    description: 'Shows what records would be affected by a retention policy without executing it'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Policy impact preview',
    type: Object
  })
  async previewRetentionPolicyImpact(@Param('policyId') policyId: string) {
    try {
      const policy = this.dataRetentionService.getRetentionPolicy(policyId);
      
      if (!policy) {
        throw new HttpException(
          `Retention policy not found: ${policyId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      // This would normally call a preview method in the service
      // For now, we'll return a mock preview
      const preview = {
        policyId: policy.id,
        policyName: policy.name,
        estimatedImpact: {
          recordsForArchival: 0,
          recordsForDeletion: 0,
          estimatedStorageSavings: '0 MB',
          affectedTables: policy.configuration.selectionCriteria.tables
        },
        warnings: [],
        recommendations: []
      };
      
      // Add warnings for critical data types
      if (policy.dataType === 'PATIENT_RECORDS' || policy.dataType === 'SESSION_NOTES') {
        preview.warnings.push('This policy affects critical healthcare data - ensure compliance requirements are met');
      }
      
      if (policy.retentionPeriod < 72) { // Less than 6 years
        preview.warnings.push('Retention period may be below HIPAA minimum requirements');
      }
      
      return {
        success: true,
        data: preview,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to preview retention policy impact', error);
      throw new HttpException(
        'Failed to preview policy impact',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Helper methods
  
  private validateRetentionPolicy(policy: CreateRetentionPolicyDto): void {
    if (!policy.id || !policy.name || !policy.dataType) {
      throw new HttpException(
        'Policy ID, name, and data type are required',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (policy.retentionPeriod <= 0 || policy.archivalPeriod <= 0) {
      throw new HttpException(
        'Retention and archival periods must be positive numbers',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (policy.retentionPeriod >= policy.archivalPeriod) {
      throw new HttpException(
        'Archival period must be longer than retention period',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (!policy.configuration?.selectionCriteria?.tables?.length) {
      throw new HttpException(
        'Policy must specify at least one table for data selection',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // Validate HIPAA compliance for healthcare data
    const healthcareDataTypes = ['PATIENT_RECORDS', 'SESSION_NOTES', 'RECORDINGS', 'BILLING_RECORDS'];
    if (healthcareDataTypes.includes(policy.dataType)) {
      if (policy.retentionPeriod < 72) { // Less than 6 years
        throw new HttpException(
          'Healthcare data must be retained for at least 6 years (72 months) per HIPAA requirements',
          HttpStatus.BAD_REQUEST
        );
      }
      
      if (!policy.complianceRequirements?.includes('HIPAA')) {
        throw new HttpException(
          'Healthcare data policies must include HIPAA compliance requirement',
          HttpStatus.BAD_REQUEST
        );
      }
      
      if (!policy.configuration?.archival?.encryptionRequired) {
        throw new HttpException(
          'Healthcare data archival must require encryption',
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }
}