import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';

@Module({
  imports: [HttpModule],
  controllers: [TherapistsController],
  providers: [TherapistsService],
})
export class TherapistsModule {}
