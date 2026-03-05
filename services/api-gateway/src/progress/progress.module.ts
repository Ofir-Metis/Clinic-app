import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProgressController } from './progress.controller';

@Module({
  imports: [HttpModule],
  controllers: [ProgressController],
})
export class ProgressModule {}
