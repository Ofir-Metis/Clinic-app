/**
 * RecordingsModule - Handles recording management and storage integration
 */

import { Module } from '@nestjs/common';
import { StorageModule, AuthModule } from '@clinic/common';
import { RecordingsController } from './recordings.controller';

@Module({
  imports: [StorageModule, AuthModule],
  controllers: [RecordingsController],
})
class RecordingsModule {}

export { RecordingsModule, RecordingsController };