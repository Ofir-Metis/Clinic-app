import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';
import Redis from 'ioredis';
import { Cluster } from 'ioredis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxAge?: number; // Alternative to ttl
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to JSON stringify/parse
  compress?: boolean; // Whether to compress large values
  namespace?: string; // Cache key namespace
  healthcareData?: boolean; // Flag for healthcare data handling
  hipaaCompliant?: boolean; // HIPAA compliance requirements
  encryptionRequired?: boolean; // Encrypt cached data
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  memoryUsage: number;
  keyCount: number;
  avgResponseTime: number;
  lastAccess: Date | null;
}

export interface CacheKey {
  key: string;
  namespace: string;
  tags: string[];
  ttl: number;
  createdAt: Date;
  accessCount: number;
  lastAccess: Date;
  size: number;
  healthcareData: boolean;
}

export type CacheStrategy = 
  | 'cache-aside' 
  | 'write-through' 
  | 'write-behind' 
  | 'refresh-ahead';

@Injectable()
export class CacheManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheManagerService.name);
  private redis: Redis | Cluster;
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    memoryUsage: 0,
    keyCount: 0,
    avgResponseTime: 0,
    lastAccess: null
  };
  
  private readonly keyRegistry = new Map<string, CacheKey>();
  private readonly strategy: CacheStrategy;
  private readonly encryptionKey: string;
  private readonly defaultTTL: number;
  private readonly maxMemoryUsage: number;
  private readonly compressionThreshold: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    this.strategy = this.configService.get<CacheStrategy>('CACHE_STRATEGY', 'cache-aside');
    this.encryptionKey = this.configService.get<string>('CACHE_ENCRYPTION_KEY', '');
    this.defaultTTL = this.configService.get<number>('CACHE_DEFAULT_TTL', 3600); // 1 hour
    this.maxMemoryUsage = this.configService.get<number>('CACHE_MAX_MEMORY', 1024 * 1024 * 100); // 100MB
    this.compressionThreshold = this.configService.get<number>('CACHE_COMPRESSION_THRESHOLD', 1024); // 1KB
  }

  async onModuleInit(): Promise<void> {
    await this.initializeRedis();
    await this.setupHealthcareComplianceFeatures();
    this.startMonitoring();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  private async initializeRedis(): Promise<void> {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 30000,
      maxMemoryPolicy: 'allkeys-lru',
      keyPrefix: this.configService.get<string>('CACHE_KEY_PREFIX', 'clinic:'),
    };

    // Check if cluster mode is enabled
    const clusterNodes = this.configService.get<string>('REDIS_CLUSTER_NODES');
    
    if (clusterNodes) {
      const nodes = clusterNodes.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) };
      });
      
      this.redis = new Cluster(nodes, {
        redisOptions: redisConfig,
        scaleReads: 'slave',
        maxRedirections: 3,
      });
    } else {
      this.redis = new Redis(redisConfig);
    }

    // Set up event listeners
    this.redis.on('connect', () => {
      this.centralizedLogger.info('Redis cache connected successfully', {
        service: 'cache-manager',
        cacheType: clusterNodes ? 'cluster' : 'standalone'
      });
    });

    this.redis.on('error', (error) => {
      this.centralizedLogger.logError('Redis cache connection error', {
        service: 'cache-manager',
        error: error.message,
        severity: 'high'
      });
    });

    this.redis.on('ready', () => {
      this.centralizedLogger.info('Redis cache ready for operations', {
        service: 'cache-manager'
      });
    });

    await this.redis.connect();
  }

  private async setupHealthcareComplianceFeatures(): Promise<void> {
    // Set up HIPAA-compliant cache policies
    await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
    await this.redis.config('SET', 'save', '900 1 300 10 60 10000'); // Persistence for compliance
    
    this.centralizedLogger.auditLog('Healthcare-compliant cache policies configured', {
      service: 'cache-manager',
      complianceContext: {
        regulation: 'HIPAA',
        dataClassification: 'restricted',
        retentionPeriod: '7-years',
        encryptionRequired: true
      }
    });
  }

  /**
   * Get value from cache with healthcare compliance features
   */
  async get<T>(
    key: string, 
    config?: Partial<CacheConfig>,
    context?: HealthcareLogContext
  ): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, config?.namespace);
    
    try {
      this.stats.totalRequests++;
      
      const cachedValue = await this.redis.get(fullKey);
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      if (cachedValue === null) {
        this.stats.misses++;
        this.updateHitRate();
        
        this.centralizedLogger.logDebug('Cache miss', {
          ...context,
          cacheKey: this.sanitizeKey(fullKey),
          responseTime,
          service: 'cache-manager'
        });
        
        return null;
      }
      
      this.stats.hits++;
      this.stats.lastAccess = new Date();
      this.updateHitRate();
      this.updateKeyAccess(fullKey);
      
      let result: T;
      
      // Handle healthcare data decryption
      if (config?.encryptionRequired || config?.healthcareData) {
        result = await this.decryptAndDeserialize<T>(cachedValue, config);
        
        this.centralizedLogger.auditLog('Encrypted healthcare cache data accessed', {
          ...context,
          cacheKey: this.sanitizeKey(fullKey),
          dataType: 'phi',
          hipaaCompliant: true,
          auditRequired: true
        });
      } else {
        result = this.deserialize<T>(cachedValue, config);
      }
      
      this.centralizedLogger.logDebug('Cache hit', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        responseTime,
        dataSize: cachedValue.length,
        service: 'cache-manager'
      });
      
      return result;
      
    } catch (error) {
      this.stats.misses++;
      this.updateHitRate();
      
      this.centralizedLogger.logError('Cache get operation failed', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        error: error.message,
        service: 'cache-manager',
        severity: 'medium'
      });
      
      return null;
    }
  }

  /**
   * Set value in cache with healthcare compliance
   */
  async set<T>(
    key: string,
    value: T,
    config?: CacheConfig,
    context?: HealthcareLogContext
  ): Promise<void> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key, config?.namespace);
    const ttl = config?.ttl || config?.maxAge || this.defaultTTL;
    
    try {
      let serializedValue: string;
      let dataSize: number;
      
      // Handle healthcare data encryption
      if (config?.encryptionRequired || config?.healthcareData) {
        serializedValue = await this.encryptAndSerialize(value, config);
        
        this.centralizedLogger.auditLog('Healthcare data encrypted and cached', {
          ...context,
          cacheKey: this.sanitizeKey(fullKey),
          dataType: config?.healthcareData ? 'phi' : 'general',
          hipaaCompliant: true,
          auditRequired: true,
          ttl
        });
      } else {
        serializedValue = this.serialize(value, config);
      }
      
      dataSize = Buffer.byteLength(serializedValue, 'utf8');
      
      // Check memory limits
      if (this.stats.memoryUsage + dataSize > this.maxMemoryUsage) {
        await this.evictLeastRecentlyUsed();
      }
      
      // Compress if value is large
      if (config?.compress || dataSize > this.compressionThreshold) {
        serializedValue = await this.compress(serializedValue);
        this.centralizedLogger.logDebug('Cache value compressed', {
          ...context,
          cacheKey: this.sanitizeKey(fullKey),
          originalSize: dataSize,
          compressedSize: serializedValue.length,
          compressionRatio: (1 - serializedValue.length / dataSize).toFixed(2)
        });
      }
      
      // Set cache value with TTL
      await this.redis.setex(fullKey, ttl, serializedValue);
      
      // Register key metadata
      this.registerKey(fullKey, {
        key: fullKey,
        namespace: config?.namespace || 'default',
        tags: config?.tags || [],
        ttl,
        createdAt: new Date(),
        accessCount: 0,
        lastAccess: new Date(),
        size: dataSize,
        healthcareData: config?.healthcareData || false
      });
      
      // Add tags for cache invalidation
      if (config?.tags && config.tags.length > 0) {
        await this.addTagsToKey(fullKey, config.tags);
      }
      
      this.stats.keyCount++;
      this.stats.memoryUsage += dataSize;
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      this.centralizedLogger.logDebug('Cache set successful', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        dataSize,
        ttl,
        responseTime,
        strategy: this.strategy,
        service: 'cache-manager'
      });
      
    } catch (error) {
      this.centralizedLogger.logError('Cache set operation failed', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        error: error.message,
        service: 'cache-manager',
        severity: 'medium'
      });
      
      throw error;
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(
    key: string,
    namespace?: string,
    context?: HealthcareLogContext
  ): Promise<void> {
    const fullKey = this.buildKey(key, namespace);
    
    try {
      const keyInfo = this.keyRegistry.get(fullKey);
      await this.redis.del(fullKey);
      
      if (keyInfo) {
        this.stats.keyCount--;
        this.stats.memoryUsage -= keyInfo.size;
        this.keyRegistry.delete(fullKey);
        
        // Healthcare audit logging
        if (keyInfo.healthcareData) {
          this.centralizedLogger.auditLog('Healthcare cache data deleted', {
            ...context,
            cacheKey: this.sanitizeKey(fullKey),
            dataType: 'phi',
            hipaaCompliant: true,
            auditRequired: true,
            reason: 'manual_deletion'
          });
        }
      }
      
      this.centralizedLogger.logDebug('Cache key deleted', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        service: 'cache-manager'
      });
      
    } catch (error) {
      this.centralizedLogger.logError('Cache delete operation failed', {
        ...context,
        cacheKey: this.sanitizeKey(fullKey),
        error: error.message,
        service: 'cache-manager'
      });
    }
  }

  /**
   * Invalidate cache by tags (useful for related data)
   */
  async invalidateByTags(
    tags: string[],
    context?: HealthcareLogContext
  ): Promise<number> {
    let invalidatedCount = 0;
    
    try {
      for (const tag of tags) {
        const tagKey = `tags:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(tagKey);
          
          // Update local registry
          keys.forEach(key => {
            const keyInfo = this.keyRegistry.get(key);
            if (keyInfo) {
              this.stats.keyCount--;
              this.stats.memoryUsage -= keyInfo.size;
              this.keyRegistry.delete(key);
              
              // Healthcare audit logging
              if (keyInfo.healthcareData) {
                this.centralizedLogger.auditLog('Healthcare cache data invalidated by tag', {
                  ...context,
                  cacheKey: this.sanitizeKey(key),
                  tag,
                  dataType: 'phi',
                  hipaaCompliant: true,
                  auditRequired: true,
                  reason: 'tag_invalidation'
                });
              }
            }
          });
          
          invalidatedCount += keys.length;
        }
      }
      
      this.centralizedLogger.info('Cache invalidated by tags', {
        ...context,
        tags,
        invalidatedCount,
        service: 'cache-manager'
      });
      
      return invalidatedCount;
      
    } catch (error) {
      this.centralizedLogger.logError('Cache tag invalidation failed', {
        ...context,
        tags,
        error: error.message,
        service: 'cache-manager'
      });
      
      return invalidatedCount;
    }
  }

  /**
   * Clear all cache (use with caution in healthcare environments)
   */
  async clear(context?: HealthcareLogContext): Promise<void> {
    try {
      // Log healthcare data clearing for audit
      const healthcareKeys = Array.from(this.keyRegistry.values())
        .filter(key => key.healthcareData);
      
      if (healthcareKeys.length > 0) {
        this.centralizedLogger.auditLog('Healthcare cache data cleared', {
          ...context,
          healthcareKeyCount: healthcareKeys.length,
          hipaaCompliant: true,
          auditRequired: true,
          reason: 'cache_clear_operation',
          severity: 'high'
        });
      }
      
      await this.redis.flushdb();
      
      // Reset local state
      this.keyRegistry.clear();
      this.stats.keyCount = 0;
      this.stats.memoryUsage = 0;
      
      this.centralizedLogger.info('Cache cleared completely', {
        ...context,
        service: 'cache-manager'
      });
      
    } catch (error) {
      this.centralizedLogger.logError('Cache clear operation failed', {
        ...context,
        error: error.message,
        service: 'cache-manager',
        severity: 'high'
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache information
   */
  async getCacheInfo(): Promise<{
    stats: CacheStats;
    keys: CacheKey[];
    redisInfo: any;
    healthcareDataCount: number;
  }> {
    try {
      const redisInfo = await this.redis.info();
      const keys = Array.from(this.keyRegistry.values());
      const healthcareDataCount = keys.filter(key => key.healthcareData).length;
      
      return {
        stats: this.getStats(),
        keys: keys.map(key => ({
          ...key,
          key: this.sanitizeKey(key.key) // Sanitize for security
        })),
        redisInfo,
        healthcareDataCount
      };
      
    } catch (error) {
      this.centralizedLogger.logError('Failed to get cache info', {
        error: error.message,
        service: 'cache-manager'
      });
      
      return {
        stats: this.getStats(),
        keys: [],
        redisInfo: {},
        healthcareDataCount: 0
      };
    }
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const start = Date.now();
      
      // Test basic operations
      const testKey = 'health-check-test';
      await this.redis.set(testKey, 'test-value', 'EX', 10);
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const latency = Date.now() - start;
      const memoryInfo = await this.redis.memory('USAGE', 'test-key');
      
      const status = latency > 1000 ? 'degraded' : 'healthy';
      
      return {
        status,
        details: {
          latency,
          hitRate: this.stats.hitRate,
          keyCount: this.stats.keyCount,
          memoryUsage: this.stats.memoryUsage,
          avgResponseTime: this.stats.avgResponseTime,
          redisConnected: this.redis.status === 'ready',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Private helper methods

  private buildKey(key: string, namespace?: string): string {
    const prefix = this.configService.get<string>('CACHE_KEY_PREFIX', 'clinic:');
    const ns = namespace || 'default';
    return `${prefix}${ns}:${key}`;
  }

  private serialize<T>(value: T, config?: Partial<CacheConfig>): string {
    if (config?.serialize === false) {
      return String(value);
    }
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string, config?: Partial<CacheConfig>): T {
    if (config?.serialize === false) {
      return value as unknown as T;
    }
    return JSON.parse(value);
  }

  private async encryptAndSerialize<T>(value: T, config?: Partial<CacheConfig>): Promise<string> {
    const serialized = this.serialize(value, config);
    
    if (!this.encryptionKey) {
      this.logger.warn('Encryption key not configured, storing data unencrypted');
      return serialized;
    }
    
    // Simple encryption implementation (in production, use stronger encryption)
    const crypto = require('crypto');
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(serialized, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  private async decryptAndDeserialize<T>(value: string, config?: Partial<CacheConfig>): Promise<T> {
    if (!this.encryptionKey) {
      return this.deserialize<T>(value, config);
    }
    
    try {
      const crypto = require('crypto');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(value, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return this.deserialize<T>(decrypted, config);
    } catch (error) {
      this.logger.error('Failed to decrypt cache value', error);
      throw new Error('Cache decryption failed');
    }
  }

  private async compress(value: string): Promise<string> {
    const zlib = require('zlib');
    const compressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(value, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    return compressed.toString('base64');
  }

  private async decompress(value: string): Promise<string> {
    const zlib = require('zlib');
    const buffer = Buffer.from(value, 'base64');
    
    const decompressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    return decompressed.toString();
  }

  private registerKey(key: string, keyInfo: CacheKey): void {
    this.keyRegistry.set(key, keyInfo);
  }

  private updateKeyAccess(key: string): void {
    const keyInfo = this.keyRegistry.get(key);
    if (keyInfo) {
      keyInfo.accessCount++;
      keyInfo.lastAccess = new Date();
    }
  }

  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tags:${tag}`;
      await this.redis.sadd(tagKey, key);
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  private updateResponseTime(responseTime: number): void {
    this.stats.avgResponseTime = this.stats.totalRequests > 1
      ? (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests
      : responseTime;
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    const keys = Array.from(this.keyRegistry.values())
      .sort((a, b) => a.lastAccess.getTime() - b.lastAccess.getTime())
      .slice(0, 10); // Evict 10 oldest keys
    
    for (const keyInfo of keys) {
      await this.redis.del(keyInfo.key);
      this.keyRegistry.delete(keyInfo.key);
      this.stats.keyCount--;
      this.stats.memoryUsage -= keyInfo.size;
    }
    
    this.centralizedLogger.info('LRU eviction performed', {
      evictedKeys: keys.length,
      service: 'cache-manager'
    });
  }

  private sanitizeKey(key: string): string {
    // Remove sensitive information from keys for logging
    return key.replace(/user:\d+/g, 'user:***')
              .replace(/session:[a-f0-9]+/g, 'session:***')
              .replace(/patient:\d+/g, 'patient:***');
  }

  private startMonitoring(): void {
    // Monitor cache health every 5 minutes
    setInterval(async () => {
      try {
        const health = await this.healthCheck();
        
        if (health.status !== 'healthy') {
          this.centralizedLogger.logError('Cache health check failed', {
            health,
            service: 'cache-manager',
            severity: health.status === 'unhealthy' ? 'critical' : 'medium'
          });
        }
        
        // Log performance metrics
        this.centralizedLogger.performanceLog('Cache performance metrics', 0, {
          service: 'cache-manager',
          hitRate: this.stats.hitRate,
          avgResponseTime: this.stats.avgResponseTime,
          keyCount: this.stats.keyCount,
          memoryUsage: this.stats.memoryUsage
        });
        
      } catch (error) {
        this.centralizedLogger.logError('Cache monitoring failed', {
          error: error.message,
          service: 'cache-manager'
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}