/**
 * Metrics Controller
 * Exposes metrics endpoints for production monitoring
 */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '@clinic/common';
import { MetricsService } from './metrics.service';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { ProductionConfigService } from '../config/production.config';

@ApiTags('Monitoring')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly configService: ProductionConfigService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get comprehensive API metrics',
    description: `
      Provides comprehensive metrics about API performance, request patterns, and system health.
      
      **Metrics Include:**
      - Request counts and success/error rates
      - Response time statistics (average, P95, P99)
      - Status code distribution
      - Per-endpoint performance metrics
      - System resource usage
      - Circuit breaker status
      
      **Use Cases:**
      - Performance monitoring and alerting
      - Capacity planning
      - System health dashboards
      - SLA monitoring
      - Debugging performance issues
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        api: {
          type: 'object',
          properties: {
            requests: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 15420 },
                success: { type: 'number', example: 14832 },
                errors: { type: 'number', example: 588 },
                rate: { type: 'number', example: 245, description: 'Requests per minute' }
              }
            },
            response: {
              type: 'object',
              properties: {
                averageTime: { type: 'number', example: 187, description: 'Average response time in ms' },
                p95Time: { type: 'number', example: 450, description: '95th percentile response time in ms' },
                p99Time: { type: 'number', example: 890, description: '99th percentile response time in ms' }
              }
            },
            status: {
              type: 'object',
              description: 'HTTP status code distribution',
              example: { '200': 12450, '400': 234, '401': 123, '500': 89 }
            },
            endpoints: {
              type: 'object',
              description: 'Per-endpoint metrics',
              additionalProperties: {
                type: 'object',
                properties: {
                  requests: { type: 'number' },
                  averageTime: { type: 'number' },
                  errors: { type: 'number' },
                  lastAccess: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        system: {
          type: 'object',
          properties: {
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', example: 256, description: 'Used memory in MB' },
                total: { type: 'number', example: 512, description: 'Total memory in MB' },
                usage: { type: 'number', example: 50, description: 'Memory usage percentage' }
              }
            },
            uptime: { type: 'number', example: 3600000, description: 'Uptime in milliseconds' }
          }
        },
        circuitBreakers: {
          type: 'object',
          description: 'Circuit breaker status for each service'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-31T10:30:00Z'
        }
      }
    }
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMetrics() {
    const metrics = this.metricsService.getFullMetrics();
    const circuitBreakers = this.circuitBreakerService.getAllStats();
    
    return {
      ...metrics,
      circuitBreakers,
      healthScore: this.metricsService.getHealthScore(),
      isUnderHighLoad: this.metricsService.isUnderHighLoad()
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get metrics summary for dashboards',
    description: `
      Provides a condensed view of key metrics suitable for dashboards and quick health checks.
      
      **Summary Includes:**
      - Overall health score (0-100)
      - Request rate and error rate
      - Average response time
      - Memory usage
      - Active alerts or issues
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        healthScore: { type: 'number', example: 87, description: 'Overall health score (0-100)' },
        requestRate: { type: 'number', example: 245, description: 'Requests per minute' },
        errorRate: { type: 'number', example: 3.8, description: 'Error rate percentage' },
        averageResponseTime: { type: 'number', example: 187, description: 'Average response time in ms' },
        memoryUsage: { type: 'number', example: 50, description: 'Memory usage percentage' },
        isUnderHighLoad: { type: 'boolean', example: false },
        activeCircuitBreakers: { type: 'number', example: 0, description: 'Number of open circuit breakers' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMetricsSummary() {
    const apiMetrics = this.metricsService.getApiMetrics();
    const systemMetrics = this.metricsService.getSystemMetrics();
    const circuitBreakers = this.circuitBreakerService.getAllStats();
    
    const errorRate = apiMetrics.requests.total > 0 
      ? (apiMetrics.requests.errors / apiMetrics.requests.total) * 100 
      : 0;
    
    const activeCircuitBreakers = Object.values(circuitBreakers)
      .filter(cb => cb.state === 'OPEN').length;

    return {
      healthScore: this.metricsService.getHealthScore(),
      requestRate: apiMetrics.requests.rate,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: apiMetrics.response.averageTime,
      memoryUsage: systemMetrics.memory.usage,
      isUnderHighLoad: this.metricsService.isUnderHighLoad(),
      activeCircuitBreakers,
      timestamp: new Date().toISOString()
    };
  }

  @Get('endpoints')
  @ApiOperation({
    summary: 'Get endpoint performance analysis',
    description: 'Detailed analysis of endpoint performance including top endpoints, slowest endpoints, and error-prone endpoints.'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Limit results per category' })
  @ApiResponse({
    status: 200,
    description: 'Endpoint analysis retrieved successfully'
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getEndpointAnalysis(@Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit, 10) || 10;
    
    return {
      topEndpoints: this.metricsService.getTopEndpoints(limitNum),
      slowestEndpoints: this.metricsService.getSlowestEndpoints(limitNum),
      errorProneEndpoints: this.metricsService.getErrorProneEndpoints(limitNum),
      timestamp: new Date().toISOString()
    };
  }

  @Get('circuit-breakers')
  @ApiOperation({
    summary: 'Get circuit breaker status',
    description: `
      Provides detailed status of all circuit breakers protecting microservice communications.
      
      **Circuit States:**
      - **CLOSED**: Normal operation, requests pass through
      - **OPEN**: Circuit is open, requests are blocked or redirected to fallback
      - **HALF_OPEN**: Testing if service has recovered
      
      **Use Cases:**
      - Monitor service health and resilience
      - Identify problematic microservices
      - Plan service recovery strategies
      - Alert on service degradation
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] },
          failures: { type: 'number', example: 3 },
          successes: { type: 'number', example: 147 },
          requests: { type: 'number', example: 150 },
          errorRate: { type: 'number', example: 0.02 },
          lastFailureTime: { type: 'string', format: 'date-time' },
          nextAttempt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCircuitBreakers() {
    return {
      circuitBreakers: this.circuitBreakerService.getAllStats(),
      timestamp: new Date().toISOString()
    };
  }

  @Get('prometheus')
  @ApiOperation({
    summary: 'Get metrics in Prometheus format',
    description: 'Exports metrics in Prometheus format for integration with Prometheus monitoring systems.'
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        example: `# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{status="success"} 14832
api_requests_total{status="error"} 588

# HELP api_response_time_seconds Response time in seconds
# TYPE api_response_time_seconds histogram
api_response_time_seconds_bucket{le="0.1"} 8921
api_response_time_seconds_bucket{le="0.5"} 13456`
      }
    }
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPrometheusMetrics() {
    const apiMetrics = this.metricsService.getApiMetrics();
    const systemMetrics = this.metricsService.getSystemMetrics();
    
    let output = '';
    
    // API request metrics
    output += '# HELP api_requests_total Total number of API requests\n';
    output += '# TYPE api_requests_total counter\n';
    output += `api_requests_total{status="success"} ${apiMetrics.requests.success}\n`;
    output += `api_requests_total{status="error"} ${apiMetrics.requests.errors}\n`;
    output += '\n';
    
    // Response time metrics
    output += '# HELP api_response_time_ms Average response time in milliseconds\n';
    output += '# TYPE api_response_time_ms gauge\n';
    output += `api_response_time_ms ${apiMetrics.response.averageTime}\n`;
    output += '\n';
    
    // Memory metrics
    output += '# HELP system_memory_usage_percent Memory usage percentage\n';
    output += '# TYPE system_memory_usage_percent gauge\n';
    output += `system_memory_usage_percent ${systemMetrics.memory.usage}\n`;
    output += '\n';
    
    // Status code metrics
    output += '# HELP api_status_codes_total HTTP status code counts\n';
    output += '# TYPE api_status_codes_total counter\n';
    for (const [status, count] of Object.entries(apiMetrics.status)) {
      output += `api_status_codes_total{code="${status}"} ${count}\n`;
    }
    
    return output;
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get production configuration status',
    description: 'Provides visibility into production configuration for debugging and validation.'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration status retrieved successfully'
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getConfig() {
    return this.configService.getHealthStatus();
  }
}