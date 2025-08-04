# Comprehensive Caching Strategy Guide

## Overview

This guide covers the implementation and usage of the comprehensive Redis-based caching system designed specifically for the clinic management platform with healthcare compliance, HIPAA encryption, and production-ready features.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [Healthcare Compliance](#healthcare-compliance)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache Architecture                        │
├─────────────────────────────────────────────────────────────┤
│  Controllers (HTTP Interceptor)                            │
│  ↓                                                          │
│  Services (Method Decorators)                               │
│  ↓                                                          │
│  CacheManagerService                                        │
│  ↓                                                          │
│  Redis (Single/Cluster)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

- **CacheManagerService**: Core caching service with Redis integration
- **CacheInterceptor**: HTTP request/response caching interceptor
- **CacheModule**: NestJS module for dependency injection
- **Cache Decorators**: Method-level caching decorators

## Features

### ✅ Production Features
- **Redis Integration**: Single instance and cluster support
- **Multiple Strategies**: Cache-aside, write-through, write-behind, refresh-ahead
- **Compression**: Automatic compression for large payloads (>1KB)
- **Serialization**: JSON serialization with custom options
- **TTL Management**: Flexible time-to-live configuration
- **Memory Management**: LRU eviction and memory limits
- **Health Monitoring**: Performance metrics and health checks

### 🏥 Healthcare Features
- **HIPAA Compliance**: Encrypted storage for PHI data
- **Audit Logging**: Complete audit trails for healthcare data access
- **Data Classification**: Automatic PHI/PII detection and handling
- **Secure Encryption**: AES-256-CBC encryption for sensitive data
- **Access Controls**: Fine-grained access control and logging

### 📊 Monitoring Features
- **Performance Metrics**: Hit rate, response times, memory usage
- **Health Checks**: Automated health monitoring
- **Alerting Integration**: Works with centralized alerting system
- **Debug Logging**: Comprehensive logging for troubleshooting

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_CLUSTER_NODES=node1:6379,node2:6379,node3:6379

# Cache Configuration
CACHE_DEFAULT_TTL=3600
CACHE_MAX_MEMORY=104857600  # 100MB
CACHE_COMPRESSION_THRESHOLD=1024  # 1KB
CACHE_KEY_PREFIX=clinic:
CACHE_STRATEGY=cache-aside

# Healthcare Encryption
CACHE_ENCRYPTION_KEY=your_32_character_encryption_key
HEALTHCARE_CACHE_ENCRYPTION_KEY=healthcare_specific_key
```

### Module Setup

#### Basic Configuration

```typescript
import { CacheModule } from '@clinic/common';

@Module({
  imports: [
    CacheModule.forRoot({
      isGlobal: true,
      redisHost: 'localhost',
      redisPort: 6379,
      defaultTTL: 3600,
      encryptionKey: process.env.CACHE_ENCRYPTION_KEY
    })
  ]
})
export class AppModule {}
```

#### Healthcare-Specific Configuration

```typescript
import { HealthcareCacheModule } from '@clinic/common';

@Module({
  imports: [
    HealthcareCacheModule.forRoot({
      isGlobal: true,
      encryptionKey: process.env.HEALTHCARE_CACHE_ENCRYPTION_KEY,
      defaultTTL: 1800, // 30 minutes for healthcare data
      maxMemoryUsage: 1024 * 1024 * 50 // 50MB limit
    })
  ]
})
export class HealthcareModule {}
```

#### Async Configuration

```typescript
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redisHost: configService.get('REDIS_HOST'),
        redisPort: configService.get('REDIS_PORT'),
        redisPassword: configService.get('REDIS_PASSWORD'),
        defaultTTL: configService.get('CACHE_DEFAULT_TTL', 3600),
        encryptionKey: configService.get('CACHE_ENCRYPTION_KEY')
      }),
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

## Usage Examples

### Method-Level Caching

#### Basic Caching
```typescript
import { Cache, CacheConfigs, CacheKeyUtils } from '@clinic/common';

@Injectable()
export class UserService {
  @Cache(
    (userId: string) => CacheKeyUtils.userKey(userId, 'profile'),
    CacheConfigs.STANDARD
  )
  async getUserProfile(userId: string) {
    // This method result will be cached for 1 hour
    return await this.userRepository.findById(userId);
  }
}
```

#### Healthcare Data Caching
```typescript
import { HealthcareCache } from '@clinic/common';

@Injectable()
export class PatientService {
  @HealthcareCache(
    (patientId: string) => CacheKeyUtils.patientKey(patientId, 'profile'),
    { 
      ttl: 1800, // 30 minutes for sensitive data
      encryptionRequired: true,
      hipaaCompliant: true,
      auditAccess: true
    }
  )
  async getPatientData(patientId: string) {
    return await this.patientRepository.findById(patientId);
  }
}
```

#### Cache Invalidation
```typescript
import { CacheInvalidate, CacheTags } from '@clinic/common';

@Injectable()
export class UserService {
  @CacheInvalidate(
    (user: any) => [
      CacheKeyUtils.userKey(user.id, 'profile'),
      CacheKeyUtils.userKey(user.id, 'preferences')
    ]
  )
  async updateUserProfile(user: any) {
    return await this.userRepository.save(user);
  }

  // Invalidate by tags
  @CacheInvalidate(
    () => [CacheTags.USERS, CacheTags.USER_PROFILES],
    true // invalidate by tags
  )
  async bulkUpdateUsers(users: any[]) {
    return await this.userRepository.save(users);
  }
}
```

### HTTP-Level Caching

```typescript
import { CacheInterceptor } from '@clinic/common';

@Controller('api/users')
@UseInterceptors(CacheInterceptor)
export class UserController {
  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: string) {
    // HTTP response will be cached automatically
    return this.userService.getUserProfile(userId);
  }
}
```

### Manual Cache Operations

```typescript
import { CacheManagerService, CacheConfigs } from '@clinic/common';

@Injectable()
export class DataService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  async manualCacheExample(key: string, data: any) {
    // Get from cache
    const cached = await this.cacheManager.get(key, CacheConfigs.STANDARD);
    if (cached) return cached;

    // Store in cache
    await this.cacheManager.set(key, data, CacheConfigs.STANDARD);
    
    // Delete from cache
    await this.cacheManager.delete(key);
    
    // Invalidate by tags
    await this.cacheManager.invalidateByTags(['users', 'profiles']);
    
    return data;
  }
}
```

## Healthcare Compliance

### HIPAA Requirements

The caching system automatically handles HIPAA compliance for healthcare data:

```typescript
// Automatically encrypted and audited
@HealthcareCache(keyGen, { encryptionRequired: true })
async getPatientPHI(patientId: string) {
  return await this.getPatientHealthInformation(patientId);
}
```

### Audit Logging

All healthcare data access is automatically logged:

```json
{
  "event": "healthcare_cache_access",
  "patientId": "***",
  "userId": "nurse-123",
  "timestamp": "2024-01-15T10:30:00Z",
  "auditRequired": true,
  "hipaaCompliant": true,
  "dataType": "phi"
}
```

### Data Encryption

Sensitive data is encrypted using AES-256-CBC:

```typescript
// Configuration
const config = {
  encryptionRequired: true,
  healthcareData: true,
  hipaaCompliant: true
};

// Data is automatically encrypted before storage
// and decrypted when retrieved
```

## Performance Monitoring

### Health Checks

```typescript
@Injectable()
export class CacheHealthService {
  constructor(private readonly cacheManager: CacheManagerService) {}

  async getHealthStatus() {
    return await this.cacheManager.healthCheck();
  }

  async getMetrics() {
    const stats = this.cacheManager.getStats();
    return {
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      avgResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`,
      memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      keyCount: stats.keyCount
    };
  }
}
```

### Performance Metrics

The system tracks comprehensive metrics:

- **Hit Rate**: Percentage of cache hits vs misses
- **Response Time**: Average cache operation response time
- **Memory Usage**: Current memory consumption
- **Key Count**: Number of cached keys
- **Healthcare Data Count**: Number of encrypted healthcare entries

### Alerting Integration

The cache system integrates with the centralized alerting system:

```typescript
// Automatic alerts for:
// - Cache miss rate > 80%
// - Memory usage > 85%
// - Response time > 100ms
// - Health check failures
```

## Best Practices

### 1. Cache Key Design

```typescript
// Good: Hierarchical and descriptive
CacheKeyUtils.userKey(userId, 'profile')      // user:123:profile
CacheKeyUtils.patientKey(patientId, 'records') // patient:456:records

// Bad: Flat and unclear
'user_profile_123'
'data_456'
```

### 2. TTL Strategy

```typescript
// Use appropriate TTLs for different data types
const configs = {
  userSessions: { ttl: 7200 },    // 2 hours
  searchResults: { ttl: 900 },    // 15 minutes
  staticData: { ttl: 86400 },     // 24 hours
  healthcareData: { ttl: 1800 }   // 30 minutes
};
```

### 3. Cache Invalidation

```typescript
// Invalidate related data together
@CacheInvalidate(
  (userId: string) => [
    CacheKeyUtils.userKey(userId, 'profile'),
    CacheKeyUtils.userKey(userId, 'preferences'),
    CacheKeyUtils.userKey(userId, 'permissions')
  ]
)
async updateUser(userId: string, data: any) {
  return await this.userRepository.save(data);
}
```

### 4. Error Handling

```typescript
// Always handle cache failures gracefully
async getData(key: string) {
  try {
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;
  } catch (error) {
    // Log error but continue with database fetch
    this.logger.warn('Cache error', error);
  }
  
  // Fallback to database
  return await this.databaseService.getData(key);
}
```

### 5. Healthcare Data

```typescript
// Always use healthcare-specific configurations
@HealthcareCache(
  keyGenerator,
  {
    ttl: 1800,                    // Shorter TTL for sensitive data
    encryptionRequired: true,     // Always encrypt PHI
    hipaaCompliant: true,         // Enable HIPAA features
    auditAccess: true            // Log all access
  }
)
async getHealthcareData(id: string) {
  return await this.healthcareRepository.findById(id);
}
```

## Troubleshooting

### Common Issues

#### 1. Cache Misses

```bash
# Check Redis connection
docker logs clinic-app_redis_1

# Verify cache configuration
curl http://localhost:4000/health/cache
```

#### 2. Memory Issues

```typescript
// Monitor memory usage
const stats = await cacheManager.getStats();
console.log('Memory usage:', stats.memoryUsage / 1024 / 1024, 'MB');

// Implement cleanup
await cacheManager.invalidateByTags(['old-data']);
```

#### 3. Encryption Errors

```bash
# Verify encryption key is set
echo $CACHE_ENCRYPTION_KEY

# Check key length (must be 32 characters for AES-256)
node -e "console.log(process.env.CACHE_ENCRYPTION_KEY.length)"
```

#### 4. Performance Issues

```typescript
// Enable debug logging
const config = {
  ...CacheConfigs.STANDARD,
  debug: true
};

// Monitor slow operations
const startTime = Date.now();
await cacheManager.get(key);
console.log('Cache operation took:', Date.now() - startTime, 'ms');
```

### Debug Commands

```bash
# Connect to Redis CLI
docker exec -it clinic-app_redis_1 redis-cli

# Check cache keys
KEYS clinic:*

# Monitor cache operations
MONITOR

# Check memory usage
INFO memory

# Check hit/miss statistics
INFO stats
```

### Logging Configuration

```bash
# Enable debug logging for cache operations
DEBUG=cache:* npm start

# View cache-specific logs
docker logs clinic-app_api-gateway_1 | grep "Cache"
```

## Monitoring Dashboard

The cache system provides endpoints for monitoring:

```bash
# Health status
GET /health/cache

# Performance metrics
GET /metrics/cache

# Cache information
GET /admin/cache/info

# Clear cache (admin only)
DELETE /admin/cache/clear
```

## Migration Guide

If migrating from an existing caching solution:

1. **Install Dependencies**
   ```bash
   yarn add ioredis
   ```

2. **Update Module Imports**
   ```typescript
   import { CacheModule } from '@clinic/common';
   ```

3. **Replace Existing Decorators**
   ```typescript
   // Old
   @Cacheable('key')
   
   // New
   @Cache(keyGenerator, config)
   ```

4. **Update Configuration**
   ```typescript
   // Add to your module
   CacheModule.forRoot(config)
   ```

5. **Test Healthcare Compliance**
   ```typescript
   // Ensure PHI data uses healthcare cache
   @HealthcareCache(keyGen, { encryptionRequired: true })
   ```

## Support

For additional support:

- Check the logs: `docker logs clinic-app_redis_1`
- Monitor health: `GET /health/cache`
- Review metrics: `GET /metrics/cache`
- Contact DevOps team for Redis cluster issues
- Review HIPAA compliance with security team