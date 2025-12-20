import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  imports: [HttpModule],
  controllers: [CoachesController],
  providers: [CoachesService],
})
export class CoachesModule {}
