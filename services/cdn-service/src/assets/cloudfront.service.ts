import { Injectable } from '@nestjs/common';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { StructuredLoggerService } from '@clinic/common';

@Injectable()
export class CloudFrontService {
  private cloudFrontClient: CloudFrontClient;
  private distributionId: string;

  constructor(private readonly logger: StructuredLoggerService) {
    this.cloudFrontClient = new CloudFrontClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || '';
  }

  /**
   * Invalidate CloudFront cache for specific paths
   */
  async invalidateCache(paths: string[]): Promise<string> {
    if (!this.distributionId) {
      this.logger.warn('CloudFront distribution ID not configured, skipping cache invalidation', {
        service: 'cdn-service',
        component: 'cloudfront',
      });
      return 'skipped';
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths.map(path => path.startsWith('/') ? path : `/${path}`),
          },
          CallerReference: `cdn-service-${Date.now()}`,
        },
      });

      const response = await this.cloudFrontClient.send(command);
      const invalidationId = response.Invalidation?.Id || 'unknown';
      
      this.logger.info('CloudFront cache invalidation created', {
        service: 'cdn-service',
        component: 'cloudfront',
        invalidationId,
        paths,
        distributionId: this.distributionId,
      });

      return invalidationId;
    } catch (error) {
      this.logger.error('Failed to create CloudFront invalidation', {
        service: 'cdn-service',
        component: 'cloudfront',
        paths,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Invalidate all cache
   */
  async invalidateAllCache(): Promise<string> {
    return this.invalidateCache(['/*']);
  }

  /**
   * Get CloudFront URL for an asset
   */
  getAssetUrl(key: string): string {
    const baseUrl = process.env.CLOUDFRONT_DOMAIN || process.env.CDN_BASE_URL;
    
    if (!baseUrl) {
      // Fallback to S3 direct URL
      const bucket = process.env.CDN_S3_BUCKET || 'clinic-cdn-assets';
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    
    return `${cleanBaseUrl}/${cleanKey}`;
  }

  /**
   * Check if CloudFront is configured
   */
  isConfigured(): boolean {
    return !!this.distributionId && !!process.env.CLOUDFRONT_DOMAIN;
  }
}