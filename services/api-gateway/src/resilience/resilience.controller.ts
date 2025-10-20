import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '@clinic/common';
import { ResilienceService, ResilienceConfig, ResiliencePattern } from './resilience.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { TimeoutService } from './timeout.service';
import { BulkheadService } from './bulkhead.service';

class UpdatePatternConfigDto {
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold?: number;
    recoveryTimeout?: number;
    successThreshold?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
  };
  timeout?: {
    enabled: boolean;
    timeoutMs?: number;
  };
  bulkhead?: {
    enabled: boolean;
    maxConcurrentCalls?: number;
    maxWaitingCalls?: number;
  };
}

class CreatePatternDto {
  name: string;
  description: string;
  config: ResilienceConfig;
}

@ApiTags('Resilience')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resilience')
export class ResilienceController {
  constructor(
    private resilienceService: ResilienceService,
    private circuitBreakerService: CircuitBreakerService,
    private retryService: RetryService,
    private timeoutService: TimeoutService,
    private bulkheadService: BulkheadService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get comprehensive system health status' })
  @ApiResponse({ status: 200, description: 'System health status retrieved successfully' })
  async getSystemHealth() {
    try {
      return await this.resilienceService.getSystemHealth();
    } catch (error) {
      throw new HttpException(
        `Failed to get system health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get all resilience patterns' })
  @ApiResponse({ status: 200, description: 'Resilience patterns retrieved successfully' })
  getPatterns() {
    try {
      const patterns = {};
      // Since patterns are private, we'll need to access them through the service
      // For now, return the known pattern names
      const knownPatterns = ['database', 'external-api', 'internal-service', 'file-operations', 'critical'];
      knownPatterns.forEach(name => {
        const pattern = this.resilienceService.getPattern(name);
        if (pattern) {
          patterns[name] = pattern;
        }
      });
      return patterns;
    } catch (error) {
      throw new HttpException(
        `Failed to get patterns: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('patterns/:name')
  @ApiOperation({ summary: 'Get specific resilience pattern' })
  @ApiParam({ name: 'name', description: 'Pattern name' })
  @ApiResponse({ status: 200, description: 'Pattern retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pattern not found' })
  getPattern(@Param('name') name: string) {
    try {
      const pattern = this.resilienceService.getPattern(name);
      if (!pattern) {
        throw new HttpException(`Pattern '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      return pattern;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get pattern: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('patterns')
  @ApiOperation({ summary: 'Create custom resilience pattern' })
  @ApiResponse({ status: 201, description: 'Pattern created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pattern configuration' })
  createPattern(@Body() createPatternDto: CreatePatternDto) {
    try {
      const pattern: ResiliencePattern = {
        name: createPatternDto.name,
        description: createPatternDto.description,
        config: createPatternDto.config,
      };
      
      this.resilienceService.registerPattern(pattern);
      return { message: `Pattern '${createPatternDto.name}' created successfully`, pattern };
    } catch (error) {
      throw new HttpException(
        `Failed to create pattern: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('patterns/:name')
  @ApiOperation({ summary: 'Update resilience pattern configuration' })
  @ApiParam({ name: 'name', description: 'Pattern name' })
  @ApiResponse({ status: 200, description: 'Pattern updated successfully' })
  @ApiResponse({ status: 404, description: 'Pattern not found' })
  updatePattern(@Param('name') name: string, @Body() config: UpdatePatternConfigDto) {
    try {
      this.resilienceService.updatePattern(name, config);
      const updatedPattern = this.resilienceService.getPattern(name);
      return { message: `Pattern '${name}' updated successfully`, pattern: updatedPattern };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(`Pattern '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to update pattern: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Circuit Breaker endpoints
  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get all circuit breaker statuses' })
  @ApiResponse({ status: 200, description: 'Circuit breaker statuses retrieved successfully' })
  getCircuitBreakers() {
    try {
      return this.circuitBreakerService.getAllStatus();
    } catch (error) {
      throw new HttpException(
        `Failed to get circuit breakers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('circuit-breakers/:name')
  @ApiOperation({ summary: 'Get specific circuit breaker status' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  @ApiResponse({ status: 200, description: 'Circuit breaker status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Circuit breaker not found' })
  getCircuitBreaker(@Param('name') name: string) {
    try {
      const status = this.circuitBreakerService.getStatus(name);
      if (!status) {
        throw new HttpException(`Circuit breaker '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      return status;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get circuit breaker: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('circuit-breakers/:name/reset')
  @ApiOperation({ summary: 'Reset circuit breaker' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
  @ApiResponse({ status: 404, description: 'Circuit breaker not found' })
  resetCircuitBreaker(@Param('name') name: string) {
    try {
      this.circuitBreakerService.reset(name);
      return { message: `Circuit breaker '${name}' reset successfully` };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(`Circuit breaker '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to reset circuit breaker: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('circuit-breakers/:name/force-open')
  @ApiOperation({ summary: 'Force circuit breaker to open state' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  @ApiResponse({ status: 200, description: 'Circuit breaker forced open successfully' })
  @ApiResponse({ status: 404, description: 'Circuit breaker not found' })
  forceOpenCircuitBreaker(@Param('name') name: string, @Body() body: { reason?: string }) {
    try {
      this.circuitBreakerService.forceOpen(name, body.reason);
      return { message: `Circuit breaker '${name}' forced open successfully` };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(`Circuit breaker '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to force open circuit breaker: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('circuit-breakers/:name/force-closed')
  @ApiOperation({ summary: 'Force circuit breaker to closed state' })
  @ApiParam({ name: 'name', description: 'Circuit breaker name' })
  @ApiResponse({ status: 200, description: 'Circuit breaker forced closed successfully' })
  @ApiResponse({ status: 404, description: 'Circuit breaker not found' })
  forceClosedCircuitBreaker(@Param('name') name: string, @Body() body: { reason?: string }) {
    try {
      this.circuitBreakerService.forceClosed(name, body.reason);
      return { message: `Circuit breaker '${name}' forced closed successfully` };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(`Circuit breaker '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to force closed circuit breaker: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Retry metrics endpoints
  @Get('retry-metrics')
  @ApiOperation({ summary: 'Get all retry metrics' })
  @ApiResponse({ status: 200, description: 'Retry metrics retrieved successfully' })
  getRetryMetrics() {
    try {
      return this.retryService.getAllMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get retry metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('retry-metrics/:operation')
  @ApiOperation({ summary: 'Get retry metrics for specific operation' })
  @ApiParam({ name: 'operation', description: 'Operation name' })
  @ApiResponse({ status: 200, description: 'Retry metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Operation metrics not found' })
  getRetryMetricsForOperation(@Param('operation') operation: string) {
    try {
      const metrics = this.retryService.getMetrics(operation);
      if (!metrics) {
        throw new HttpException(`Retry metrics for operation '${operation}' not found`, HttpStatus.NOT_FOUND);
      }
      return metrics;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get retry metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('retry-metrics/:operation')
  @ApiOperation({ summary: 'Clear retry metrics for specific operation' })
  @ApiParam({ name: 'operation', description: 'Operation name' })
  @ApiResponse({ status: 200, description: 'Retry metrics cleared successfully' })
  clearRetryMetricsForOperation(@Param('operation') operation: string) {
    try {
      this.retryService.clearMetrics(operation);
      return { message: `Retry metrics for operation '${operation}' cleared successfully` };
    } catch (error) {
      throw new HttpException(
        `Failed to clear retry metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Timeout metrics endpoints
  @Get('timeout-metrics')
  @ApiOperation({ summary: 'Get all timeout metrics' })
  @ApiResponse({ status: 200, description: 'Timeout metrics retrieved successfully' })
  getTimeoutMetrics() {
    try {
      return this.timeoutService.getAllMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get timeout metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('timeout-metrics/:operation')
  @ApiOperation({ summary: 'Get timeout metrics for specific operation' })
  @ApiParam({ name: 'operation', description: 'Operation name' })
  @ApiResponse({ status: 200, description: 'Timeout metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Operation metrics not found' })
  getTimeoutMetricsForOperation(@Param('operation') operation: string) {
    try {
      const metrics = this.timeoutService.getMetrics(operation);
      if (!metrics) {
        throw new HttpException(`Timeout metrics for operation '${operation}' not found`, HttpStatus.NOT_FOUND);
      }
      return metrics;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get timeout metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('timeout-config')
  @ApiOperation({ summary: 'Get timeout service configuration' })
  @ApiResponse({ status: 200, description: 'Timeout configuration retrieved successfully' })
  getTimeoutConfig() {
    try {
      return this.timeoutService.getConfig();
    } catch (error) {
      throw new HttpException(
        `Failed to get timeout config: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('timeout-status')
  @ApiOperation({ summary: 'Get timeout service status' })
  @ApiResponse({ status: 200, description: 'Timeout status retrieved successfully' })
  getTimeoutStatus() {
    try {
      return {
        activeTimeoutCount: this.timeoutService.getActiveTimeoutCount(),
        config: this.timeoutService.getConfig(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get timeout status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Bulkhead endpoints
  @Get('bulkheads')
  @ApiOperation({ summary: 'Get all bulkhead statuses' })
  @ApiResponse({ status: 200, description: 'Bulkhead statuses retrieved successfully' })
  getBulkheads() {
    try {
      return this.bulkheadService.getAllStatus();
    } catch (error) {
      throw new HttpException(
        `Failed to get bulkheads: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('bulkheads/:name')
  @ApiOperation({ summary: 'Get specific bulkhead status' })
  @ApiParam({ name: 'name', description: 'Bulkhead name' })
  @ApiResponse({ status: 200, description: 'Bulkhead status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bulkhead not found' })
  getBulkhead(@Param('name') name: string) {
    try {
      const status = this.bulkheadService.getStatus(name);
      if (!status) {
        throw new HttpException(`Bulkhead '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      return status;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get bulkhead: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('bulkheads/system/status')
  @ApiOperation({ summary: 'Get bulkhead system status' })
  @ApiResponse({ status: 200, description: 'Bulkhead system status retrieved successfully' })
  getBulkheadSystemStatus() {
    try {
      return this.bulkheadService.getSystemStatus();
    } catch (error) {
      throw new HttpException(
        `Failed to get bulkhead system status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('bulkheads/:name/metrics')
  @ApiOperation({ summary: 'Clear bulkhead metrics' })
  @ApiParam({ name: 'name', description: 'Bulkhead name' })
  @ApiResponse({ status: 200, description: 'Bulkhead metrics cleared successfully' })
  @ApiResponse({ status: 404, description: 'Bulkhead not found' })
  clearBulkheadMetrics(@Param('name') name: string) {
    try {
      this.bulkheadService.clearMetrics(name);
      return { message: `Bulkhead metrics for '${name}' cleared successfully` };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(`Bulkhead '${name}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to clear bulkhead metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // System operations
  @Delete('metrics')
  @ApiOperation({ summary: 'Clear all resilience metrics' })
  @ApiResponse({ status: 200, description: 'All metrics cleared successfully' })
  clearAllMetrics() {
    try {
      this.resilienceService.clearAllMetrics();
      return { message: 'All resilience metrics cleared successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to clear all metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test/:pattern')
  @ApiOperation({ summary: 'Test resilience pattern with dummy operation' })
  @ApiParam({ name: 'pattern', description: 'Pattern name to test' })
  @ApiQuery({ name: 'shouldFail', required: false, description: 'Whether the test should fail' })
  @ApiResponse({ status: 200, description: 'Pattern test completed successfully' })
  async testPattern(
    @Param('pattern') pattern: string,
    @Query('shouldFail') shouldFail?: string
  ) {
    try {
      const willFail = shouldFail === 'true';
      
      const testOperation = async () => {
        if (willFail) {
          throw new Error('Test operation failure');
        }
        return { message: 'Test operation succeeded', timestamp: new Date() };
      };

      const fallback = async () => {
        return { message: 'Fallback operation executed', timestamp: new Date() };
      };

      const result = await this.resilienceService.execute(
        pattern,
        'test-operation',
        testOperation,
        fallback
      );

      return {
        pattern,
        testConfiguration: { shouldFail: willFail },
        result,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        `Pattern test failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}