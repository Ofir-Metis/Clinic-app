import { Injectable } from '@nestjs/common';
import { S3Service, AssetInfo } from './s3.service';
import { CloudFrontService } from './cloudfront.service';
import { OptimizationService } from '../optimization/optimization.service';
import { StructuredLoggerService } from '@clinic/common';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AssetUploadResult {
  key: string;
  url: string;
  info: AssetInfo;
  optimized?: boolean;
}

export interface AssetUploadOptions {
  folder?: string;
  optimize?: boolean;
  variants?: string[]; // e.g., ['thumbnail', 'medium', 'large']
  customKey?: string;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly cloudFrontService: CloudFrontService,
    private readonly optimizationService: OptimizationService,
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Upload asset with optional optimization
   */
  async uploadAsset(
    buffer: Buffer,
    filename: string,
    options: AssetUploadOptions = {},
  ): Promise<AssetUploadResult> {
    const key = this.generateAssetKey(filename, options);
    let processedBuffer = buffer;
    let optimized = false;

    try {
      // Optimize if requested and file type supports it
      if (options.optimize && this.isOptimizable(filename)) {
        processedBuffer = await this.optimizationService.optimizeImage(buffer, {
          quality: 85,
          format: 'auto',
        });
        optimized = true;
        
        this.logger.info('Asset optimized', {
          service: 'cdn-service',
          component: 'assets',
          originalSize: buffer.length,
          optimizedSize: processedBuffer.length,
          compression: ((buffer.length - processedBuffer.length) / buffer.length * 100).toFixed(2) + '%',
        });
      }

      // Upload main asset
      const info = await this.s3Service.uploadAsset(processedBuffer, {
        key,
        metadata: {
          originalFilename: filename,
          optimized: optimized.toString(),
          uploadedAt: new Date().toISOString(),
        },
      });

      // Generate variants if requested
      if (options.variants && options.variants.length > 0 && this.isImage(filename)) {
        await this.generateImageVariants(processedBuffer, key, options.variants);
      }

      const url = this.cloudFrontService.getAssetUrl(key);

      this.logger.info('Asset uploaded successfully', {
        service: 'cdn-service',
        component: 'assets',
        key,
        url,
        size: info.size,
        optimized,
      });

      return {
        key,
        url,
        info,
        optimized,
      };
    } catch (error) {
      this.logger.error('Failed to upload asset', {
        service: 'cdn-service',
        component: 'assets',
        filename,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get asset URL
   */
  getAssetUrl(key: string): string {
    return this.cloudFrontService.getAssetUrl(key);
  }

  /**
   * Get asset with caching headers
   */
  async getAsset(key: string): Promise<{ buffer: Buffer; info: AssetInfo }> {
    try {
      return await this.s3Service.getAsset(key);
    } catch (error) {
      this.logger.error('Failed to get asset', {
        service: 'cdn-service',
        component: 'assets',
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete asset and its variants
   */
  async deleteAsset(key: string): Promise<void> {
    try {
      // Delete main asset
      await this.s3Service.deleteAsset(key);

      // Delete variants
      const variantKeys = await this.getVariantKeys(key);
      for (const variantKey of variantKeys) {
        try {
          await this.s3Service.deleteAsset(variantKey);
        } catch (error) {
          // Continue if variant doesn't exist
          this.logger.warn('Failed to delete asset variant', {
            service: 'cdn-service',
            component: 'assets',
            variantKey,
            error: error.message,
          });
        }
      }

      // Invalidate CloudFront cache
      const pathsToInvalidate = [key, ...variantKeys];
      await this.cloudFrontService.invalidateCache(pathsToInvalidate);

      this.logger.info('Asset deleted successfully', {
        service: 'cdn-service',
        component: 'assets',
        key,
        variantsDeleted: variantKeys.length,
      });
    } catch (error) {
      this.logger.error('Failed to delete asset', {
        service: 'cdn-service',
        component: 'assets',
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if asset exists
   */
  async assetExists(key: string): Promise<boolean> {
    return this.s3Service.assetExists(key);
  }

  /**
   * Get asset metadata
   */
  async getAssetInfo(key: string): Promise<AssetInfo | null> {
    return this.s3Service.getAssetInfo(key);
  }

  /**
   * Invalidate cache for specific assets
   */
  async invalidateCache(keys: string[]): Promise<string> {
    return this.cloudFrontService.invalidateCache(keys);
  }

  /**
   * Generate unique asset key
   */
  private generateAssetKey(filename: string, options: AssetUploadOptions): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(filename);
    const basename = path.basename(filename, extension);
    
    if (options.customKey) {
      return options.customKey.endsWith(extension) ? options.customKey : `${options.customKey}${extension}`;
    }

    const folder = options.folder || 'assets';
    const safeName = basename.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    
    return `${folder}/${timestamp}-${randomString}-${safeName}${extension}`;
  }

  /**
   * Check if file type can be optimized
   */
  private isOptimizable(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension);
  }

  /**
   * Check if file is an image
   */
  private isImage(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(extension);
  }

  /**
   * Generate image variants (thumbnails, different sizes)
   */
  private async generateImageVariants(
    buffer: Buffer,
    originalKey: string,
    variants: string[],
  ): Promise<void> {
    const promises = variants.map(async (variant) => {
      try {
        const variantBuffer = await this.generateVariant(buffer, variant);
        const variantKey = this.getVariantKey(originalKey, variant);
        
        await this.s3Service.uploadAsset(variantBuffer, {
          key: variantKey,
          metadata: {
            variant,
            originalKey,
            generatedAt: new Date().toISOString(),
          },
        });

        this.logger.debug('Generated image variant', {
          service: 'cdn-service',
          component: 'assets',
          originalKey,
          variantKey,
          variant,
        });
      } catch (error) {
        this.logger.error('Failed to generate image variant', {
          service: 'cdn-service',
          component: 'assets',
          originalKey,
          variant,
          error: error.message,
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Generate specific image variant
   */
  private async generateVariant(buffer: Buffer, variant: string): Promise<Buffer> {
    switch (variant) {
      case 'thumbnail':
        return this.optimizationService.optimizeImage(buffer, {
          width: 150,
          height: 150,
          fit: 'cover',
          quality: 80,
        });
      
      case 'small':
        return this.optimizationService.optimizeImage(buffer, {
          width: 300,
          quality: 80,
        });
      
      case 'medium':
        return this.optimizationService.optimizeImage(buffer, {
          width: 600,
          quality: 85,
        });
      
      case 'large':
        return this.optimizationService.optimizeImage(buffer, {
          width: 1200,
          quality: 90,
        });
      
      default:
        return buffer;
    }
  }

  /**
   * Get variant key from original key
   */
  private getVariantKey(originalKey: string, variant: string): string {
    const extension = path.extname(originalKey);
    const basename = originalKey.replace(extension, '');
    return `${basename}-${variant}${extension}`;
  }

  /**
   * Get all possible variant keys for an asset
   */
  private async getVariantKeys(originalKey: string): Promise<string[]> {
    const variants = ['thumbnail', 'small', 'medium', 'large'];
    return variants.map(variant => this.getVariantKey(originalKey, variant));
  }
}