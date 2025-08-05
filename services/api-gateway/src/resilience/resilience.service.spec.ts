import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResilienceService } from './resilience.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { TimeoutService } from './timeout.service';
import { BulkheadService } from './bulkhead.service';

describe('ResilienceService', () => {
  let service: ResilienceService;
  let circuitBreakerService: CircuitBreakerService;
  let retryService: RetryService;
  let timeoutService: TimeoutService;
  let bulkheadService: BulkheadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResilienceService,
        CircuitBreakerService,
        RetryService,
        TimeoutService,
        BulkheadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3,
                CIRCUIT_BREAKER_RECOVERY_TIMEOUT: 60000,
                CIRCUIT_BREAKER_SUCCESS_THRESHOLD: 2,
                RETRY_MAX_RETRIES: 3,
                RETRY_INITIAL_DELAY: 1000,
                TIMEOUT_DEFAULT: 30000,
                BULKHEAD_MAX_CONCURRENT_CALLS: 10,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ResilienceService>(ResilienceService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    retryService = module.get<RetryService>(RetryService);
    timeoutService = module.get<TimeoutService>(TimeoutService);
    bulkheadService = module.get<BulkheadService>(BulkheadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should execute operation successfully with database pattern', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await service.execute(
        'database',
        'test-operation',
        mockOperation
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when operation fails', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const mockFallback = jest.fn().mockResolvedValue('fallback-result');
      
      const result = await service.execute(
        'external-api',
        'test-operation',
        mockOperation,
        mockFallback
      );

      expect(result).toBe('fallback-result');
      expect(mockOperation).toHaveBeenCalled();
      expect(mockFallback).toHaveBeenCalled();
    });

    it('should throw error when pattern not found', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      await expect(
        service.execute('nonexistent-pattern', 'test-operation', mockOperation)
      ).rejects.toThrow("Resilience pattern 'nonexistent-pattern' not found");
    });
  });

  describe('predefined patterns', () => {
    it('should have database pattern configured', () => {
      const pattern = service.getPattern('database');
      expect(pattern).toBeDefined();
      expect(pattern?.config.circuitBreaker?.enabled).toBe(true);
      expect(pattern?.config.retry?.enabled).toBe(true);
      expect(pattern?.config.timeout?.enabled).toBe(true);
      expect(pattern?.config.bulkhead?.enabled).toBe(true);
    });

    it('should have external-api pattern configured', () => {
      const pattern = service.getPattern('external-api');
      expect(pattern).toBeDefined();
      expect(pattern?.config.circuitBreaker?.enabled).toBe(true);
      expect(pattern?.config.retry?.maxRetries).toBe(5);
    });

    it('should have critical pattern configured', () => {
      const pattern = service.getPattern('critical');
      expect(pattern).toBeDefined();
      expect(pattern?.config.circuitBreaker?.failureThreshold).toBe(2);
      expect(pattern?.config.timeout?.timeoutMs).toBe(5000);
    });
  });

  describe('executeDatabase', () => {
    it('should execute with database pattern', async () => {
      const mockOperation = jest.fn().mockResolvedValue('database-result');
      
      const result = await service.executeDatabase('get-patient', mockOperation);
      
      expect(result).toBe('database-result');
      expect(mockOperation).toHaveBeenCalled();
    });
  });

  describe('executeExternalAPI', () => {
    it('should execute with external-api pattern', async () => {
      const mockOperation = jest.fn().mockResolvedValue('api-result');
      
      const result = await service.executeExternalAPI('insurance-check', mockOperation);
      
      expect(result).toBe('api-result');
      expect(mockOperation).toHaveBeenCalled();
    });
  });

  describe('registerPattern', () => {
    it('should register custom pattern', () => {
      const customPattern = {
        name: 'custom-test',
        description: 'Test pattern',
        config: {
          circuitBreaker: { enabled: true, failureThreshold: 5 },
          retry: { enabled: false },
          timeout: { enabled: true, timeoutMs: 10000 },
          bulkhead: { enabled: false },
        },
      };

      service.registerPattern(customPattern);
      const registered = service.getPattern('custom-test');
      
      expect(registered).toEqual(customPattern);
    });
  });

  describe('updatePattern', () => {
    it('should update existing pattern configuration', () => {
      const newConfig = {
        timeout: { timeoutMs: 45000 },
        bulkhead: { maxConcurrentCalls: 25 },
      };

      service.updatePattern('database', newConfig);
      const updated = service.getPattern('database');
      
      expect(updated?.config.timeout?.timeoutMs).toBe(45000);
      expect(updated?.config.bulkhead?.maxConcurrentCalls).toBe(25);
    });

    it('should throw error when updating non-existent pattern', () => {
      expect(() => {
        service.updatePattern('nonexistent', { timeout: { timeoutMs: 1000 } });
      }).toThrow("Pattern 'nonexistent' not found");
    });
  });

  describe('getSystemHealth', () => {
    it('should return comprehensive system health status', async () => {
      const health = await service.getSystemHealth();
      
      expect(health).toHaveProperty('systemStatus');
      expect(health).toHaveProperty('healthScore');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('patterns');
      expect(health).toHaveProperty('recommendations');
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.systemStatus);
      expect(health.healthScore).toBeGreaterThanOrEqual(0);
      expect(health.healthScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(health.patterns)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });
  });

  describe('protect', () => {
    it('should create protected function wrapper', async () => {
      const originalFunction = jest.fn().mockResolvedValue('protected-result');
      const protectedFunction = service.protect(
        'database',
        'protected-operation',
        originalFunction
      );

      const result = await protectedFunction('arg1', 'arg2');
      
      expect(result).toBe('protected-result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use fallback in protected function when original fails', async () => {
      const originalFunction = jest.fn().mockRejectedValue(new Error('Original failed'));
      const fallbackFunction = jest.fn().mockResolvedValue('fallback-result');
      
      const protectedFunction = service.protect(
        'external-api',
        'protected-operation',
        originalFunction,
        fallbackFunction
      );

      const result = await protectedFunction('arg1');
      
      expect(result).toBe('fallback-result');
      expect(originalFunction).toHaveBeenCalledWith('arg1');
      expect(fallbackFunction).toHaveBeenCalledWith('arg1');
    });
  });

  describe('clearAllMetrics', () => {
    it('should clear metrics from all services', () => {
      const clearRetryMetricsSpy = jest.spyOn(retryService, 'clearAllMetrics');
      const clearTimeoutMetricsSpy = jest.spyOn(timeoutService, 'clearAllMetrics');
      const clearBulkheadMetricsSpy = jest.spyOn(bulkheadService, 'clearAllMetrics');

      service.clearAllMetrics();

      expect(clearRetryMetricsSpy).toHaveBeenCalled();
      expect(clearTimeoutMetricsSpy).toHaveBeenCalled();
      expect(clearBulkheadMetricsSpy).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple pattern layers for critical operations', async () => {
      let attemptCount = 0;
      const flakeyOperation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Service temporarily unavailable');
        }
        return 'success-after-retries';
      });

      const result = await service.executeCritical(
        'flaky-operation',
        flakeyOperation
      );

      expect(result).toBe('success-after-retries');
      expect(attemptCount).toBeGreaterThan(1);
    });

    it('should handle timeout with retry pattern', async () => {
      const slowOperation = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow operation
        return 'completed';
      });

      const result = await service.execute(
        'database',
        'slow-operation',
        slowOperation
      );

      expect(result).toBe('completed');
      expect(slowOperation).toHaveBeenCalled();
    });

    it('should respect bulkhead limits', async () => {
      const longRunningOperation = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'completed';
      });

      // Start multiple operations that should hit bulkhead limits
      const promises = Array.from({ length: 15 }, (_, i) =>
        service.execute('file-operations', `operation-${i}`, longRunningOperation)
          .catch(error => error)
      );

      const results = await Promise.all(promises);
      
      // Some operations should succeed, some might be rejected due to bulkhead limits
      const successful = results.filter(r => r === 'completed').length;
      const rejected = results.filter(r => r instanceof Error).length;
      
      expect(successful + rejected).toBe(15);
      expect(successful).toBeGreaterThan(0); // At least some should succeed
    });
  });

  describe('error scenarios', () => {
    it('should handle circuit breaker activation', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));
      const fallback = jest.fn().mockResolvedValue('fallback-used');

      // Execute multiple failing operations to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute('external-api', 'failing-operation', failingOperation, fallback);
        } catch (error) {
          // Expected for some iterations
        }
      }

      // Circuit breaker should now be open, subsequent calls should use fallback
      const result = await service.execute('external-api', 'failing-operation', failingOperation, fallback);
      expect(result).toBe('fallback-used');
    });

    it('should handle nested error scenarios', async () => {
      const primaryOperation = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackOperation = jest.fn().mockRejectedValue(new Error('Fallback failed'));

      await expect(
        service.execute('critical', 'nested-failure', primaryOperation, fallbackOperation)
      ).rejects.toThrow();

      expect(primaryOperation).toHaveBeenCalled();
      expect(fallbackOperation).toHaveBeenCalled();
    });
  });

  describe('gracefulShutdown', () => {
    it('should shutdown all services gracefully', async () => {
      const timeoutShutdownSpy = jest.spyOn(timeoutService, 'gracefulShutdown').mockResolvedValue();
      const bulkheadShutdownSpy = jest.spyOn(bulkheadService, 'gracefulShutdown').mockResolvedValue();

      await service.gracefulShutdown(5000);

      expect(timeoutShutdownSpy).toHaveBeenCalled();
      expect(bulkheadShutdownSpy).toHaveBeenCalledWith(5000);
    });
  });
});