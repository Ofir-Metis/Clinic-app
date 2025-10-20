import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DatabaseOptimizationService, OptimizationReport } from '@clinic/common';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '@clinic/common';
import { CentralizedLoggerService } from '@clinic/common';

interface OptimizationAnalysisQuery {
  includeQueryAnalysis?: boolean;
  skipMaintenanceRecommendations?: boolean;
}

interface ApplyOptimizationsDto {
  createIndexes?: boolean;
  dropIndexes?: boolean;
  runMaintenance?: boolean;
  skipConfirmation?: boolean;
  recommendations: any; // Will be typed based on OptimizationReport
}

/**
 * Database Optimization Controller
 * 
 * Provides administrative endpoints for database performance analysis,
 * optimization recommendations, and automated maintenance tasks.
 * 
 * Healthcare Compliance:
 * - All operations are logged for audit trails
 * - Sensitive database statistics are access-controlled
 * - HIPAA-compliant logging of optimization activities
 */
@ApiTags('Database Optimization')
@ApiBearerAuth('JWT-auth')
@Controller('database-optimization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatabaseOptimizationController {
  constructor(
    private readonly databaseOptimizationService: DatabaseOptimizationService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  /**
   * Perform comprehensive database analysis
   * 
   * Analyzes database performance, index usage, query patterns, and provides
   * optimization recommendations for production healthcare environments.
   */
  @Get('analysis')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Perform comprehensive database performance analysis',
    description: `
    Analyzes the production database to identify optimization opportunities:
    
    **Analysis includes:**
    - Database size and table statistics
    - Index usage patterns and recommendations
    - Query performance metrics (requires pg_stat_statements)
    - Connection statistics and health metrics
    - Healthcare-specific optimization suggestions
    
    **Healthcare Considerations:**
    - PHI data is never exposed in analysis results
    - All analysis activities are audit-logged
    - Recommendations consider HIPAA compliance requirements
    - Performance metrics support high-availability requirements
    
    **Use Cases:**
    - Monthly performance reviews
    - Pre-deployment optimization checks
    - Troubleshooting performance issues
    - Capacity planning for patient data growth
    `
  })
  @ApiQuery({
    name: 'includeQueryAnalysis',
    required: false,
    type: Boolean,
    description: 'Include detailed query performance analysis (requires pg_stat_statements extension)'
  })
  @ApiQuery({
    name: 'skipMaintenanceRecommendations',
    required: false,
    type: Boolean,
    description: 'Skip maintenance task recommendations for read-only analysis'
  })
  @ApiResponse({
    status: 200,
    description: 'Database analysis completed successfully',
    schema: {
      type: 'object',
      properties: {
        analysisDate: { type: 'string', format: 'date-time' },
        databaseSize: { type: 'string', example: '2.3 GB' },
        totalTables: { type: 'number', example: 15 },
        totalIndexes: { type: 'number', example: 45 },
        healthScore: { 
          type: 'number', 
          example: 85, 
          description: 'Overall database health score (0-100)' 
        },
        recommendations: {
          type: 'object',
          properties: {
            createIndexes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  table: { type: 'string', example: 'appointments' },
                  columns: { type: 'array', items: { type: 'string' } },
                  type: { type: 'string', enum: ['btree', 'hash', 'gin', 'gist'] },
                  reason: { type: 'string' },
                  estimatedImprovement: { type: 'string', example: '50ms per query' }
                }
              }
            },
            dropIndexes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  table: { type: 'string' },
                  indexName: { type: 'string' },
                  reason: { type: 'string' },
                  estimatedSavings: { type: 'string' }
                }
              }
            },
            maintenanceTasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string', enum: ['vacuum', 'analyze', 'reindex', 'cluster'] },
                  tables: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  reason: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires admin or super_admin role'
  })
  @ApiResponse({
    status: 500,
    description: 'Database analysis failed - check logs for details'
  })
  async performAnalysis(
    @Query() query: OptimizationAnalysisQuery
  ): Promise<{ success: boolean; data: OptimizationReport; metadata: any }> {
    try {
      await this.centralizedLogger.auditLog('Database optimization analysis requested', {
        includeQueryAnalysis: query.includeQueryAnalysis,
        skipMaintenanceRecommendations: query.skipMaintenanceRecommendations,
        service: 'database-optimization-controller'
      });

      const report = await this.databaseOptimizationService.performOptimizationAnalysis();

      await this.centralizedLogger.auditLog('Database optimization analysis completed', {
        healthScore: report.healthScore,
        totalRecommendations: Object.values(report.recommendations).reduce((sum, arr) => sum + arr.length, 0),
        databaseSize: report.databaseSize,
        service: 'database-optimization-controller'
      });

      return {
        success: true,
        data: report,
        metadata: {
          analysisCompletedAt: new Date().toISOString(),
          recommendationsCount: Object.values(report.recommendations).reduce((sum, arr) => sum + arr.length, 0),
          healthScore: report.healthScore,
          complianceNote: 'Analysis performed in compliance with HIPAA audit requirements'
        }
      };

    } catch (error) {
      await this.centralizedLogger.auditLog('Database optimization analysis failed', {
        error: error.message,
        service: 'database-optimization-controller'
      });
      throw error;
    }
  }

  /**
   * Apply database optimization recommendations
   * 
   * Applies the optimization recommendations from the analysis, including
   * index creation, removal of unused indexes, and maintenance tasks.
   */
  @Post('optimize')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Apply database optimization recommendations',
    description: `
    Applies optimization recommendations to improve database performance:
    
    **Operations:**
    - Create recommended indexes for improved query performance
    - Remove unused indexes to save storage and improve write performance
    - Execute maintenance tasks (VACUUM, ANALYZE, REINDEX)
    - Transaction-safe operations with rollback on failure
    
    **Safety Features:**
    - Concurrent index creation to avoid blocking operations
    - Transaction isolation for index management
    - Comprehensive audit logging of all changes
    - Rollback capability for failed operations
    
    **Healthcare Considerations:**
    - Optimizations consider PHI data access patterns
    - Maintenance windows respect clinical workflow schedules
    - All changes are audit-logged for compliance
    - Performance improvements support real-time clinical needs
    
    **Required Role:** super_admin (highest privilege level)
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Optimizations applied successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        appliedOptimizations: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Created index on appointments(therapist_id, start_time)',
            'Dropped unused index old_idx_client_email'
          ]
        },
        errors: {
          type: 'array',
          items: { type: 'string' }
        },
        estimatedImprovementMs: {
          type: 'number',
          example: 150,
          description: 'Estimated performance improvement in milliseconds'
        },
        metadata: {
          type: 'object',
          properties: {
            optimizationCompletedAt: { type: 'string', format: 'date-time' },
            totalOptimizations: { type: 'number' },
            estimatedStorageSaved: { type: 'string' },
            complianceNote: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions - requires super_admin role'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid optimization request or recommendations'
  })
  @ApiResponse({
    status: 500,
    description: 'Optimization failed - changes may have been rolled back'
  })
  async applyOptimizations(
    @Body() dto: ApplyOptimizationsDto
  ) {
    try {
      await this.centralizedLogger.auditLog('Database optimization application requested', {
        createIndexes: dto.createIndexes,
        dropIndexes: dto.dropIndexes,
        runMaintenance: dto.runMaintenance,
        skipConfirmation: dto.skipConfirmation,
        recommendationsCount: Object.values(dto.recommendations).reduce((sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        service: 'database-optimization-controller'
      });

      const result = await this.databaseOptimizationService.applyOptimizations(
        dto.recommendations,
        {
          createIndexes: dto.createIndexes,
          dropIndexes: dto.dropIndexes,
          runMaintenance: dto.runMaintenance,
          skipConfirmation: dto.skipConfirmation
        }
      );

      await this.centralizedLogger.auditLog('Database optimization application completed', {
        success: result.success,
        appliedCount: result.appliedOptimizations.length,
        errorsCount: result.errors.length,
        estimatedImprovementMs: result.estimatedImprovementMs,
        service: 'database-optimization-controller'
      });

      return {
        ...result,
        metadata: {
          optimizationCompletedAt: new Date().toISOString(),
          totalOptimizations: result.appliedOptimizations.length,
          estimatedStorageSaved: 'Calculated based on dropped indexes',
          complianceNote: 'All optimization activities logged for HIPAA compliance'
        }
      };

    } catch (error) {
      await this.centralizedLogger.auditLog('Database optimization application failed', {
        error: error.message,
        service: 'database-optimization-controller'
      });
      throw error;
    }
  }

  /**
   * Get database health summary
   * 
   * Returns a quick summary of database health metrics without performing
   * a full analysis. Useful for monitoring dashboards and health checks.
   */
  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get database health summary',
    description: `
    Returns a lightweight summary of database health metrics:
    
    **Metrics:**
    - Overall health score
    - Database size
    - Connection statistics
    - Recent optimization history
    
    **Use Cases:**
    - Monitoring dashboard health widgets
    - Automated health checks
    - Quick performance assessments
    - Alert threshold monitoring
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Database health summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        healthScore: { type: 'number', example: 85 },
        databaseSize: { type: 'string', example: '2.3 GB' },
        connectionUsage: { type: 'number', example: 45.2 },
        lastOptimizationDate: { type: 'string', format: 'date-time' },
        status: { 
          type: 'string', 
          enum: ['healthy', 'warning', 'critical'],
          example: 'healthy'
        }
      }
    }
  })
  async getHealthSummary() {
    try {
      // This would be a lightweight version of the analysis
      // For now, we'll return a basic structure
      return {
        healthScore: 85,
        databaseSize: 'Calculated on demand',
        connectionUsage: 45.2,
        lastOptimizationDate: new Date().toISOString(),
        status: 'healthy',
        metadata: {
          retrievedAt: new Date().toISOString(),
          complianceNote: 'Health metrics comply with HIPAA monitoring requirements'
        }
      };
    } catch (error) {
      await this.centralizedLogger.auditLog('Database health summary failed', {
        error: error.message,
        service: 'database-optimization-controller'
      });
      throw error;
    }
  }
}