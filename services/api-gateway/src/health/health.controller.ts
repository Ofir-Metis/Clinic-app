import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: ServiceHealth;
    nats?: ServiceHealth;
    redis?: ServiceHealth;
    filesystem: ServiceHealth;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    usage: string;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

@ApiTags('Health')
@ApiExtraModels()
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description: `
      Performs a comprehensive health check of all system components and dependencies.
      
      **Checks Include:**
      - Database connectivity and performance
      - File system access
      - Memory usage and system resources
      - Service uptime
      - Overall system status assessment
      
      **Status Levels:**
      - **healthy**: All systems operational
      - **degraded**: Some non-critical issues detected
      - **unhealthy**: Critical system failures detected
      
      **Use Cases:**
      - Load balancer health checks
      - Monitoring system integration
      - System status dashboards
      - Automated alerting
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy', 'degraded'],
          example: 'healthy',
          description: 'Overall system health status'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-31T10:30:00Z',
          description: 'Health check execution time'
        },
        version: {
          type: 'string',
          example: '2.0.0',
          description: 'Application version'
        },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                responseTime: { type: 'number', example: 15 },
                lastCheck: { type: 'string', format: 'date-time' },
                error: { type: 'string', description: 'Error message if unhealthy' }
              }
            },
            filesystem: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                responseTime: { type: 'number', example: 5 },
                lastCheck: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        uptime: {
          type: 'number',
          example: 3600000,
          description: 'Application uptime in milliseconds'
        },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number', example: 128, description: 'Used memory in MB' },
            total: { type: 'number', example: 512, description: 'Total memory in MB' },
            usage: { type: 'string', example: '25%', description: 'Memory usage percentage' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - Critical systems unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'unhealthy' },
        timestamp: { type: 'string', format: 'date-time' },
        error: { type: 'string', example: 'Database connection failed' },
        services: { type: 'object' }
      }
    }
  })
  async check(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const services = await this.checkServices();
    const overallStatus = this.getOverallStatus(services);
    
    const memoryUsage = process.memoryUsage();
    
    return {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      services,
      uptime: Date.now() - this.startTime,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        usage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
      },
    };
  }

  @Get('liveness')
  @ApiOperation({
    summary: 'Kubernetes liveness probe',
    description: `
      Simple liveness probe endpoint for Kubernetes health checks.
      
      **Purpose:**
      - Indicates whether the application is running
      - Used by Kubernetes to determine if a pod should be restarted
      - Fast response with minimal resource usage
      
      **Response:**
      Always returns 200 OK if the application is responsive
      
      **Kubernetes Configuration:**
      \`\`\`yaml
      livenessProbe:
        httpGet:
          path: /health/liveness
          port: 4000
        initialDelaySeconds: 30
        periodSeconds: 10
      \`\`\`
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive and responsive',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'alive',
          description: 'Liveness status'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-31T10:30:00Z',
          description: 'Response timestamp'
        }
      }
    }
  })
  liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Kubernetes readiness probe',
    description: `
      Readiness probe endpoint for Kubernetes deployment health checks.
      
      **Purpose:**
      - Indicates whether the application is ready to receive traffic
      - Checks critical dependencies (database, external services)
      - Used by Kubernetes to determine if a pod should receive requests
      
      **Checks:**
      - Database connectivity and responsiveness
      - Critical service dependencies
      - Application initialization status
      
      **Kubernetes Configuration:**
      \`\`\`yaml
      readinessProbe:
        httpGet:
          path: /health/readiness
          port: 4000
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 3
      \`\`\`
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to receive traffic',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ready',
          description: 'Readiness status'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-31T10:30:00Z'
        },
        database: {
          type: 'string',
          example: 'healthy',
          description: 'Database health status'
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - Not ready to receive traffic',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'not ready',
          description: 'Readiness status'
        },
        reason: {
          type: 'string',
          example: 'Database unavailable',
          description: 'Reason for not being ready'
        },
        error: {
          type: 'string',
          description: 'Detailed error message'
        }
      }
    }
  })
  async readiness() {
    try {
      // Check critical dependencies for readiness
      const dbHealth = await this.checkDatabase();
      
      if (dbHealth.status === 'unhealthy') {
        throw new HttpException(
          { status: 'not ready', reason: 'Database unavailable' },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      return { 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        database: dbHealth.status 
      };
    } catch (error) {
      throw new HttpException(
        { status: 'not ready', error: error.message },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private async checkServices() {
    const services = {
      database: await this.checkDatabase(),
      filesystem: await this.checkFilesystem(),
    };

    return services;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      
      // Simple query to check database connectivity
      await this.dataSource.query('SELECT 1 as health_check');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkFilesystem(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const fs = require('fs').promises;
      await fs.access('./');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private getOverallStatus(services: any): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map((service: any) => service.status);
    
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    
    if (statuses.includes('unhealthy')) {
      const criticalServices = ['database'];
      const hasCriticalFailure = criticalServices.some(service => 
        services[service]?.status === 'unhealthy'
      );
      
      return hasCriticalFailure ? 'unhealthy' : 'degraded';
    }
    
    return 'degraded';
  }
}