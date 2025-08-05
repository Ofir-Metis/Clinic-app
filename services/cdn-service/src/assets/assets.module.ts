import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { S3Service } from './s3.service';
import { CloudFrontService } from './cloudfront.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, S3Service, CloudFrontService],
  exports: [AssetsService, S3Service, CloudFrontService],
})
export class AssetsModule {}