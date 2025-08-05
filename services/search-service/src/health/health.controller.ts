import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly elasticsearch: ElasticsearchService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async checkHealth() {
    const elasticsearchHealth = await this.elasticsearch.healthCheck();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'search-service',
      version: '1.0.0',
      dependencies: {
        elasticsearch: elasticsearchHealth,
        database: await this.checkDatabaseHealth(),
      },
    };

    // Determine overall health status
    const hasUnhealthyDependencies = Object.values(health.dependencies)
      .some(dep => dep.status === 'unhealthy');
      
    if (hasUnhealthyDependencies) {
      health.status = 'degraded';
    }

    return health;
  }

  @Get('elasticsearch')
  @ApiOperation({ summary: 'Elasticsearch health check' })
  @ApiResponse({ status: 200, description: 'Elasticsearch health status' })
  async checkElasticsearchHealth() {
    return this.elasticsearch.healthCheck();
  }

  private async checkDatabaseHealth(): Promise<{ status: string }> {
    try {
      // Simple database connectivity check
      // This would need to be implemented based on your database setup
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}