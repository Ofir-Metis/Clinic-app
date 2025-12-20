import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { CoachProfile } from './coach-profile.entity';
import { MockJwtService } from '../mock-jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoachProfile])],
  controllers: [CoachesController],
  providers: [CoachesService, MockJwtService],
})
export class CoachesModule {}
