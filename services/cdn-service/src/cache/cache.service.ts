import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StructuredLoggerService } from '@clinic/common';
import { CloudFrontService } from '../assets/cloudfront.service';

@Injectable()
export class CacheService {
  private cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastInvalidation: null as Date | null,
  };

  constructor(
    private readonly cloudFrontService: CloudFrontService,
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Warm up cache for frequently accessed assets
   * Runs every day at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async warmupCache(): Promise<void> {
    this.logger.info('Starting cache warmup', {
      service: 'cdn-service',
      component: 'cache',
    });

    try {
      // List of frequently accessed assets to warm up
      const frequentAssets = await this.getFrequentlyAccessedAssets();
      
      // Pre-fetch these assets to ensure they're cached
      const warmupPromises = frequentAssets.map(asset => this.warmupAsset(asset));
      await Promise.allSettled(warmupPromises);

      this.logger.info('Cache warmup completed', {
        service: 'cdn-service',
        component: 'cache',
        assetsWarmedUp: frequentAssets.length,
      });
    } catch (error) {
      this.logger.error('Cache warmup failed', {
        service: 'cdn-service',
        component: 'cache',
        error: error.message,
      });
    }
  }

  /**
   * Clean up old cache entries
   * Runs every Sunday at 2 AM
   */
  @Cron(CronExpression.EVERY_SUNDAY_AT_2AM)
  async cleanupCache(): Promise<void> {
    this.logger.info('Starting cache cleanup', {
      service: 'cdn-service',
      component: 'cache',
    });

    try {
      // Invalidate old or unused assets
      const oldAssets = await this.getOldCacheEntries();
      
      if (oldAssets.length > 0) {
        await this.cloudFrontService.invalidateCache(oldAssets);
        this.cacheStats.invalidations += oldAssets.length;
        this.cacheStats.lastInvalidation = new Date();
      }

      this.logger.info('Cache cleanup completed', {
        service: 'cdn-service',
        component: 'cache',
        assetsInvalidated: oldAssets.length,
      });
    } catch (error) {
      this.logger.error('Cache cleanup failed', {
        service: 'cdn-service',
        component: 'cache',
        error: error.message,
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    invalidations: number;
    hitRate: number;
    lastInvalidation: Date | null;
  } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;

    return {
      ...this.cacheStats,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheStats.hits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheStats.misses++;
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCachePattern(pattern: string): Promise<string> {
    try {
      const paths = this.expandPattern(pattern);
      const invalidationId = await this.cloudFrontService.invalidateCache(paths);
      
      this.cacheStats.invalidations += paths.length;
      this.cacheStats.lastInvalidation = new Date();

      this.logger.info('Cache invalidated by pattern', {
        service: 'cdn-service',
        component: 'cache',
        pattern,
        paths,
        invalidationId,
      });

      return invalidationId;
    } catch (error) {
      this.logger.error('Failed to invalidate cache by pattern', {
        service: 'cdn-service',
        component: 'cache',
        pattern,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get cache headers for different asset types
   */
  getCacheHeaders(assetKey: string): Record<string, string> {
    const extension = assetKey.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
        };
      
      case 'css':
      case 'js':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
        };
      
      case 'pdf':
      case 'doc':
      case 'docx':
        return {
          'Cache-Control': 'public, max-age=86400',
          'Expires': new Date(Date.now() + 86400 * 1000).toUTCString(),
        };
      
      case 'mp4':
      case 'webm':
      case 'ogg':
      case 'mp3':
      case 'wav':
      case 'm4a':
        return {
          'Cache-Control': 'public, max-age=604800',
          'Expires': new Date(Date.now() + 604800 * 1000).toUTCString(),
        };
      
      default:
        return {
          'Cache-Control': 'public, max-age=3600',
          'Expires': new Date(Date.now() + 3600 * 1000).toUTCString(),
        };
    }
  }

  /**
   * Check if asset should be cached based on size and type
   */
  shouldCache(assetKey: string, size: number): boolean {
    const extension = assetKey.split('.').pop()?.toLowerCase();
    const maxSize = 50 * 1024 * 1024; // 50MB max cache size

    // Don't cache very large files
    if (size > maxSize) {
      return false;
    }

    // Cache static assets
    const cacheableExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'css', 'js', 'woff', 'woff2', 'ttf', 'eot',
      'pdf', 'mp4', 'webm', 'mp3', 'wav'
    ];

    return cacheableExtensions.includes(extension || '');
  }

  /**
   * Get frequently accessed assets (placeholder implementation)
   */
  private async getFrequentlyAccessedAssets(): Promise<string[]> {
    // This would typically query analytics or access logs
    // For now, return common assets that should be warmed up
    return [
      'assets/logo.png',
      'assets/favicon.ico',
      'assets/default-avatar.jpg',
      'css/main.css',
      'js/main.js',
    ];
  }

  /**
   * Warm up a specific asset
   */
  private async warmupAsset(assetKey: string): Promise<void> {
    try {
      // Make a HEAD request to the CDN URL to warm up the cache
      const url = this.cloudFrontService.getAssetUrl(assetKey);
      
      // In a real implementation, you would make an HTTP request here
      // For now, just log the intent
      this.logger.debug('Warming up asset', {
        service: 'cdn-service',
        component: 'cache',
        assetKey,
        url,
      });
    } catch (error) {
      this.logger.warn('Failed to warm up asset', {
        service: 'cdn-service',
        component: 'cache',
        assetKey,
        error: error.message,
      });
    }
  }

  /**
   * Get old cache entries that should be invalidated
   */
  private async getOldCacheEntries(): Promise<string[]> {
    // This would typically query for assets older than a certain date
    // or assets that haven't been accessed recently
    // For now, return an empty array as placeholder
    return [];
  }

  /**
   * Expand wildcard patterns to specific paths
   */
  private expandPattern(pattern: string): string[] {
    // Simple pattern expansion - in production you might want more sophisticated logic
    if (pattern.includes('*')) {
      return [pattern]; // Let CloudFront handle the wildcard
    }
    
    return [pattern];
  }
}