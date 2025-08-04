import { Injectable, Logger } from '@nestjs/common';
import { Repository, EntityManager, SelectQueryBuilder } from 'typeorm';

export interface SafeQueryOptions {
  maxResults?: number;
  timeout?: number;
  allowRawQueries?: boolean;
}

@Injectable()
export class SafeQueryService {
  private readonly logger = new Logger(SafeQueryService.name);
  private readonly DEFAULT_MAX_RESULTS = 1000;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute a safe parameterized query with built-in protections
   */
  async executeQuery<T>(
    repository: Repository<T> | EntityManager,
    query: string,
    parameters: any[] = [],
    options: SafeQueryOptions = {}
  ): Promise<T[]> {
    const {
      maxResults = this.DEFAULT_MAX_RESULTS,
      timeout = this.DEFAULT_TIMEOUT,
      allowRawQueries = false
    } = options;

    // Validate query safety
    this.validateQuery(query, allowRawQueries);

    // Validate parameters
    this.validateParameters(parameters);

    try {
      const startTime = Date.now();
      
      // Add LIMIT clause if not present and maxResults is set
      const safeQuery = this.addLimitToQuery(query, maxResults);
      
      // Execute with timeout
      const result = await Promise.race([
        repository.query(safeQuery, parameters),
        this.createTimeout(timeout)
      ]);

      const duration = Date.now() - startTime;
      this.logger.debug(`Query executed in ${duration}ms: ${safeQuery.substring(0, 100)}...`);

      return result;
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`, error.stack);
      
      // Log potential security issues
      if (this.isPotentialSecurityIssue(error)) {
        this.logger.warn('Potential SQL injection attempt detected', {
          query: query.substring(0, 200),
          parameters: parameters.slice(0, 10), // Log first 10 params only
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Create a safe query builder with automatic parameterization
   */
  createSafeQueryBuilder<T>(
    repository: Repository<T>,
    alias: string
  ): SafeQueryBuilder<T> {
    const queryBuilder = repository.createQueryBuilder(alias);
    return new SafeQueryBuilder(queryBuilder, this);
  }

  /**
   * Validate query for potential SQL injection patterns
   */
  private validateQuery(query: string, allowRawQueries: boolean): void {
    if (!allowRawQueries) {
      // Check for dangerous patterns
      const dangerousPatterns = [
        /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\s+/i,
        /UNION\s+SELECT/i,
        /--\s*$/m,
        /\/\*.*\*\//,
        /xp_\w+/i,
        /sp_\w+/i,
        /';\s*(DROP|DELETE|UPDATE|INSERT)/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
          throw new Error(`Potentially dangerous SQL pattern detected: ${pattern.source}`);
        }
      }
    }

    // Check for basic SQL structure
    if (!query.trim().match(/^(SELECT|WITH)\s+/i)) {
      throw new Error('Only SELECT and WITH queries are allowed for safety');
    }
  }

  /**
   * Validate query parameters
   */
  private validateParameters(parameters: any[]): void {
    if (parameters.length > 100) {
      throw new Error('Too many parameters provided (max 100)');
    }

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      
      // Check for potential SQL injection in string parameters
      if (typeof param === 'string') {
        if (param.length > 10000) {
          throw new Error(`Parameter ${i} is too long (max 10000 characters)`);
        }
        
        // Check for dangerous SQL patterns in parameters
        if (this.containsDangerousPattern(param)) {
          this.logger.warn(`Suspicious parameter detected at index ${i}: ${param.substring(0, 100)}`);
        }
      }
    }
  }

  /**
   * Add LIMIT clause to query if not present
   */
  private addLimitToQuery(query: string, maxResults: number): string {
    const trimmedQuery = query.trim();
    
    // Check if LIMIT is already present
    if (/LIMIT\s+\d+/i.test(trimmedQuery)) {
      return query;
    }

    // Add LIMIT clause
    return `${trimmedQuery} LIMIT ${maxResults}`;
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Check if error might be a security issue
   */
  private isPotentialSecurityIssue(error: any): boolean {
    const securityKeywords = [
      'syntax error',
      'permission denied',
      'access denied',
      'privilege',
      'unauthorized'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if string contains dangerous SQL patterns
   */
  private containsDangerousPattern(str: string): boolean {
    const patterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /and\s+1\s*=\s*1/i,
      /';\s*(drop|delete|insert|update)/i,
      /exec\s*\(/i,
      /--/,
      /\/\*/,
      /xp_cmdshell/i
    ];

    return patterns.some(pattern => pattern.test(str));
  }
}

/**
 * Enhanced query builder with automatic SQL injection protection
 */
export class SafeQueryBuilder<T> {
  constructor(
    private queryBuilder: SelectQueryBuilder<T>,
    private safeQueryService: SafeQueryService
  ) {}

  where(condition: string, parameters?: any): this {
    // Validate parameters before adding to query
    if (parameters) {
      this.safeQueryService['validateParameters'](Object.values(parameters));
    }
    this.queryBuilder.where(condition, parameters);
    return this;
  }

  andWhere(condition: string, parameters?: any): this {
    if (parameters) {
      this.safeQueryService['validateParameters'](Object.values(parameters));
    }
    this.queryBuilder.andWhere(condition, parameters);
    return this;
  }

  orWhere(condition: string, parameters?: any): this {
    if (parameters) {
      this.safeQueryService['validateParameters'](Object.values(parameters));
    }
    this.queryBuilder.orWhere(condition, parameters);
    return this;
  }

  orderBy(sort: string, order?: 'ASC' | 'DESC'): this {
    // Validate sort field to prevent injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sort)) {
      throw new Error('Invalid sort field name');
    }
    this.queryBuilder.orderBy(sort, order);
    return this;
  }

  limit(limit: number): this {
    if (limit > 10000) {
      throw new Error('Limit too high (max 10000)');
    }
    this.queryBuilder.limit(limit);
    return this;
  }

  offset(offset: number): this {
    if (offset > 1000000) {
      throw new Error('Offset too high (max 1000000)');
    }
    this.queryBuilder.offset(offset);
    return this;
  }

  async getMany(): Promise<T[]> {
    const query = this.queryBuilder.getQuery();
    const parameters = this.queryBuilder.getParameters();
    
    // Use safe query execution
    return this.safeQueryService.executeQuery(
      this.queryBuilder.connection.manager,
      query,
      Object.values(parameters)
    );
  }

  async getOne(): Promise<T | undefined> {
    this.queryBuilder.limit(1);
    const results = await this.getMany();
    return results[0];
  }

  async getCount(): Promise<number> {
    // Count queries are generally safe
    return this.queryBuilder.getCount();
  }

  // Pass through other methods to the underlying query builder
  select(selection?: string | string[]): this {
    if (selection) {
      if (Array.isArray(selection)) {
        this.queryBuilder.select(selection);
      } else {
        this.queryBuilder.select([selection]);
      }
    }
    return this;
  }

  leftJoin(property: string, alias: string, condition?: string, parameters?: any): this {
    if (parameters) {
      this.safeQueryService['validateParameters'](Object.values(parameters));
    }
    this.queryBuilder.leftJoin(property, alias, condition, parameters);
    return this;
  }

  innerJoin(property: string, alias: string, condition?: string, parameters?: any): this {
    if (parameters) {
      this.safeQueryService['validateParameters'](Object.values(parameters));
    }
    this.queryBuilder.innerJoin(property, alias, condition, parameters);
    return this;
  }
}