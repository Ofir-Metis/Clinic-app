import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: Error;
  timestamp: Date;
}

export interface RetryMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalRetries: number;
  averageRetries: number;
  successAfterRetries: number;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private retryMetrics = new Map<string, RetryMetrics>();

  constructor(private configService: ConfigService) {}

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operationName: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = this.getRetryConfig(config);
    const attempts: RetryAttempt[] = [];
    let lastError: Error;

    // Initialize metrics if not exists
    if (!this.retryMetrics.has(operationName)) {
      this.retryMetrics.set(operationName, {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalRetries: 0,
        averageRetries: 0,
        successAfterRetries: 0,
      });
    }

    const metrics = this.retryMetrics.get(operationName)!;
    metrics.totalOperations++;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      const attemptInfo: RetryAttempt = {
        attempt: attempt + 1,
        delay: 0,
        timestamp: new Date(),
      };

      try {
        const result = await operation();
        
        // Record successful attempt
        attempts.push(attemptInfo);
        metrics.successfulOperations++;
        
        if (attempt > 0) {
          metrics.successAfterRetries++;
          metrics.totalRetries += attempt;
          this.logger.log(
            `Operation '${operationName}' succeeded after ${attempt} retries`
          );
        }

        this.updateAverageRetries(metrics);
        return result;
      } catch (error) {
        lastError = error as Error;
        attemptInfo.error = lastError;
        attempts.push(attemptInfo);

        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryConfig)) {
          this.logger.error(
            `Operation '${operationName}' failed with non-retryable error:`,
            lastError.message
          );
          metrics.failedOperations++;
          throw lastError;
        }

        // If this was the last attempt, don't wait
        if (attempt === retryConfig.maxRetries) {
          this.logger.error(
            `Operation '${operationName}' failed after ${retryConfig.maxRetries + 1} attempts:`,
            lastError.message
          );
          metrics.failedOperations++;
          metrics.totalRetries += attempt;
          this.updateAverageRetries(metrics);
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryConfig);
        attemptInfo.delay = delay;

        this.logger.warn(
          `Operation '${operationName}' failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
          `retrying in ${delay}ms: ${lastError.message}`
        );

        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }

  /**
   * Execute with exponential backoff and circuit breaker integration
   */
  async executeWithBackoff<T>(
    operationName: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    const retryConfig = this.getRetryConfig(config);
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryConfig)) {
          throw lastError;
        }

        // If this was the last attempt, don't wait
        if (attempt === retryConfig.maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateExponentialBackoffDelay(attempt, retryConfig);
        
        this.logger.warn(
          `Exponential backoff retry for '${operationName}' (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
          `waiting ${delay}ms: ${lastError.message}`
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute with fixed interval retry
   */
  async executeWithFixedInterval<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries: number = 3,
    intervalMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          this.logger.error(
            `Fixed interval retry for '${operationName}' failed after ${maxRetries + 1} attempts:`,
            lastError.message
          );
          throw lastError;
        }

        this.logger.warn(
          `Fixed interval retry for '${operationName}' (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `waiting ${intervalMs}ms: ${lastError.message}`
        );

        await this.sleep(intervalMs);
      }
    }

    throw lastError!;
  }

  /**
   * Execute with custom retry condition
   */
  async executeWithCondition<T>(
    operationName: string,
    operation: () => Promise<T>,
    shouldRetry: (error: Error, attempt: number) => boolean,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check custom retry condition
        if (!shouldRetry(lastError, attempt + 1) || attempt === maxRetries) {
          this.logger.error(
            `Conditional retry for '${operationName}' stopped after ${attempt + 1} attempts:`,
            lastError.message
          );
          throw lastError;
        }

        this.logger.warn(
          `Conditional retry for '${operationName}' (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `waiting ${delayMs}ms: ${lastError.message}`
        );

        await this.sleep(delayMs);
      }
    }

    throw lastError!;
  }

  /**
   * Get default retry configuration
   */
  private getRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
    const defaultConfig: RetryConfig = {
      maxRetries: this.configService.get('RETRY_MAX_RETRIES', 3),
      initialDelay: this.configService.get('RETRY_INITIAL_DELAY', 1000),
      maxDelay: this.configService.get('RETRY_MAX_DELAY', 30000),
      backoffMultiplier: this.configService.get('RETRY_BACKOFF_MULTIPLIER', 2),
      jitter: this.configService.get('RETRY_JITTER', true),
      retryableErrors: this.configService.get('RETRY_RETRYABLE_ERRORS', [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNRESET',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EAI_AGAIN',
        'Operation timeout',
        'socket hang up',
        'Request failed',
        'Service unavailable',
        'Internal server error',
        'Bad gateway',
        'Gateway timeout',
      ]).split(','),
      nonRetryableErrors: this.configService.get('RETRY_NON_RETRYABLE_ERRORS', [
        'Authentication failed',
        'Unauthorized',
        'Forbidden',
        'Not found',
        'Bad request',
        'Validation error',
        'Invalid input',
        'Conflict',
        'Precondition failed',
      ]).split(','),
    };

    return { ...defaultConfig, ...overrides };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Check non-retryable errors first (these take precedence)
    const isNonRetryable = config.nonRetryableErrors.some(
      nonRetryableError => 
        errorMessage.includes(nonRetryableError.toLowerCase()) ||
        errorName.includes(nonRetryableError.toLowerCase())
    );

    if (isNonRetryable) {
      return false;
    }

    // Check retryable errors
    const isRetryable = config.retryableErrors.some(
      retryableError => 
        errorMessage.includes(retryableError.toLowerCase()) ||
        errorName.includes(retryableError.toLowerCase())
    );

    // For HTTP errors, retry 5xx but not 4xx
    if ('status' in error || 'statusCode' in error) {
      const status = (error as any).status || (error as any).statusCode;
      if (status >= 500 && status < 600) {
        return true;
      }
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    return isRetryable;
  }

  /**
   * Calculate delay with jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += Math.random() * jitterAmount - jitterAmount / 2;
    }

    return Math.round(delay);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateExponentialBackoffDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelay * Math.pow(2, attempt);
    let delay = Math.min(exponentialDelay, config.maxDelay);

    // Add jitter
    if (config.jitter) {
      const jitterRange = delay * 0.2; // 20% jitter for exponential backoff
      delay += Math.random() * jitterRange - jitterRange / 2;
    }

    return Math.round(Math.max(delay, 0));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update average retries metric
   */
  private updateAverageRetries(metrics: RetryMetrics) {
    if (metrics.successfulOperations > 0) {
      metrics.averageRetries = metrics.totalRetries / metrics.successfulOperations;
    }
  }

  /**
   * Get retry metrics for an operation
   */
  getMetrics(operationName: string): RetryMetrics | null {
    return this.retryMetrics.get(operationName) || null;
  }

  /**
   * Get all retry metrics
   */
  getAllMetrics(): Record<string, RetryMetrics> {
    const allMetrics: Record<string, RetryMetrics> = {};
    for (const [name, metrics] of this.retryMetrics) {
      allMetrics[name] = { ...metrics };
    }
    return allMetrics;
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operationName: string) {
    this.retryMetrics.delete(operationName);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics() {
    this.retryMetrics.clear();
  }

  /**
   * Create a retryable operation wrapper
   */
  createRetryableOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ) {
    return () => this.execute(operationName, operation, config);
  }
}