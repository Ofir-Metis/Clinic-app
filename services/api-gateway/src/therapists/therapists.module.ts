import { Module, HttpModule } from '@nestjs/common';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';

@Module({
  imports: [HttpModule],
  controllers: [TherapistsController],
  providers: [TherapistsService],
})
export class TherapistsModule {}
