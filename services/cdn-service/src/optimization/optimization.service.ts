import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { StructuredLoggerService } from '@clinic/common';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  progressive?: boolean;
  lossless?: boolean;
}

@Injectable()
export class OptimizationService {
  constructor(private readonly logger: StructuredLoggerService) {}

  /**
   * Optimize image with Sharp
   */
  async optimizeImage(buffer: Buffer, options: OptimizationOptions = {}): Promise<Buffer> {
    try {
      let transformer = sharp(buffer);

      // Resize if dimensions specified
      if (options.width || options.height) {
        transformer = transformer.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'inside',
          withoutEnlargement: true,
        });
      }

      // Determine output format
      const outputFormat = await this.determineOutputFormat(buffer, options.format);
      
      // Apply format-specific optimizations
      switch (outputFormat) {
        case 'jpeg':
          transformer = transformer.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive !== false,
          });
          break;
        
        case 'png':
          transformer = transformer.png({
            quality: options.quality || 90,
            progressive: options.progressive !== false,
          });
          break;
        
        case 'webp':
          transformer = transformer.webp({
            quality: options.quality || 85,
            lossless: options.lossless || false,
          });
          break;
        
        case 'avif':
          transformer = transformer.avif({
            quality: options.quality || 80,
            lossless: options.lossless || false,
          });
          break;
      }

      const optimizedBuffer = await transformer.toBuffer();

      this.logger.debug('Image optimized', {
        service: 'cdn-service',
        component: 'optimization',
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length,
        format: outputFormat,
        compression: ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2) + '%',
      });

      return optimizedBuffer;
    } catch (error) {
      this.logger.error('Image optimization failed', {
        service: 'cdn-service',
        component: 'optimization',
        error: error.message,
        options,
      });
      
      // Return original buffer if optimization fails
      return buffer;
    }
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveImages(
    buffer: Buffer,
    breakpoints: number[] = [480, 768, 1024, 1440, 1920],
  ): Promise<Array<{ width: number; buffer: Buffer }>> {
    const results = [];

    for (const width of breakpoints) {
      try {
        const optimizedBuffer = await this.optimizeImage(buffer, {
          width,
          quality: 85,
          format: 'auto',
        });

        results.push({ width, buffer: optimizedBuffer });
      } catch (error) {
        this.logger.warn('Failed to generate responsive image', {
          service: 'cdn-service',
          component: 'optimization',
          width,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Create image thumbnail
   */
  async createThumbnail(
    buffer: Buffer,
    size: number = 150,
    quality: number = 80,
  ): Promise<Buffer> {
    return this.optimizeImage(buffer, {
      width: size,
      height: size,
      fit: 'cover',
      quality,
      format: 'auto',
    });
  }

  /**
   * Convert image to modern format (WebP/AVIF)
   */
  async convertToModernFormat(
    buffer: Buffer,
    format: 'webp' | 'avif' = 'webp',
    quality: number = 85,
  ): Promise<Buffer> {
    return this.optimizeImage(buffer, {
      format,
      quality,
    });
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    colorSpace: string;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
      };
    } catch (error) {
      this.logger.error('Failed to get image metadata', {
        service: 'cdn-service',
        component: 'optimization',
        error: error.message,
      });
      
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        size: buffer.length,
        hasAlpha: false,
        colorSpace: 'unknown',
      };
    }
  }

  /**
   * Validate if buffer is a valid image
   */
  async isValidImage(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine optimal output format
   */
  private async determineOutputFormat(
    buffer: Buffer,
    requestedFormat?: string,
  ): Promise<string> {
    if (requestedFormat && requestedFormat !== 'auto') {
      return requestedFormat;
    }

    try {
      const metadata = await sharp(buffer).metadata();
      const originalFormat = metadata.format;

      // Prefer modern formats for new images
      if (this.supportsModernFormats()) {
        // Use WebP for most images, AVIF for very high quality needs
        if (originalFormat === 'png' && metadata.hasAlpha) {
          return 'webp'; // WebP handles transparency well
        }
        return 'webp';
      }

      // Fallback to optimized traditional formats
      switch (originalFormat) {
        case 'jpeg':
        case 'jpg':
          return 'jpeg';
        case 'png':
          return 'png';
        case 'webp':
          return 'webp';
        case 'gif':
          return 'png'; // Convert GIF to PNG for better optimization
        default:
          return 'jpeg'; // Default fallback
      }
    } catch (error) {
      return 'jpeg'; // Ultimate fallback
    }
  }

  /**
   * Check if modern formats are supported (based on user agent or configuration)
   */
  private supportsModernFormats(): boolean {
    // In a real implementation, this would check user agent or configuration
    // For now, assume modern formats are supported
    return process.env.ENABLE_MODERN_FORMATS !== 'false';
  }
}