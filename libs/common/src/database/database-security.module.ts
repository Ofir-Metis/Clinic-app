import { Module, Global } from '@nestjs/common';
import { SafeQueryService } from './safe-query.service';

@Global()
@Module({
  providers: [SafeQueryService],
  exports: [SafeQueryService],
})
export class DatabaseSecurityModule {}