import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';
import { TherapistProfile } from './therapist-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TherapistProfile])],
  controllers: [TherapistsController],
  providers: [TherapistsService],
})
export class TherapistsModule {}
