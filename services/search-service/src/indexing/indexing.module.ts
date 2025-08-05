import { Module } from '@nestjs/common';
import { IndexingService } from './indexing.service';
import { DataSyncService } from './data-sync.service';

@Module({
  providers: [IndexingService, DataSyncService],
  exports: [IndexingService, DataSyncService],
})
export class IndexingModule {}