import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';
import { TherapistProfile } from './therapist-profile.entity';
import { MockJwtService } from '../mock-jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([TherapistProfile])],
  controllers: [TherapistsController],
  providers: [TherapistsService, MockJwtService],
})
export class TherapistsModule {}
