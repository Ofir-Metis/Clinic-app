import { Module, HttpModule } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [HttpModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
