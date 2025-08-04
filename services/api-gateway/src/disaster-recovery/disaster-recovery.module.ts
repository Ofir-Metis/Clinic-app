import { Module } from '@nestjs/common';
import { DisasterRecoveryModule as CommonDisasterRecoveryModule } from '@clinic/common';
import { DisasterRecoveryController } from './disaster-recovery.controller';

@Module({
  imports: [
    CommonDisasterRecoveryModule.forFeature()
  ],
  controllers: [DisasterRecoveryController],
  providers: [],
  exports: []
})
export class DisasterRecoveryModule {}