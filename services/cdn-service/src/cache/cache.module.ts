import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [AssetsModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}