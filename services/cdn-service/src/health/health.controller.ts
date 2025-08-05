import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { S3Service } from '../assets/s3.service';
import { CloudFrontService } from '../assets/cloudfront.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly cloudFrontService: CloudFrontService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async checkHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cdn-service',
      version: '1.0.0',
      dependencies: {
        s3: await this.checkS3Health(),
        cloudfront: this.checkCloudFrontHealth(),
      },
      cache: this.cacheService.getCacheStats(),
    };

    // Determine overall health status
    const hasUnhealthyDependencies = Object.values(health.dependencies)
      .some(dep => dep.status === 'unhealthy');
      
    if (hasUnhealthyDependencies) {
      health.status = 'degraded';
    }

    return health;
  }

  @Get('s3')
  @ApiOperation({ summary: 'S3 health check' })
  @ApiResponse({ status: 200, description: 'S3 health status' })
  async checkS3Health() {
    try {
      // Try to check if a test object exists (or perform a simple operation)
      const testKey = 'health-check-test.txt';
      await this.s3Service.assetExists(testKey);
      
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  @Get('cloudfront')
  @ApiOperation({ summary: 'CloudFront health check' })
  @ApiResponse({ status: 200, description: 'CloudFront health status' })
  checkCloudFrontHealth() {
    const isConfigured = this.cloudFrontService.isConfigured();
    
    return {
      status: isConfigured ? 'healthy' : 'not-configured',
      configured: isConfigured,
    };
  }

  @Get('cache')
  @ApiOperation({ summary: 'Cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }
}