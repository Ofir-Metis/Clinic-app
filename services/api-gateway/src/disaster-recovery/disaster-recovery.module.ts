import { Module } from '@nestjs/common';
import { DisasterRecoveryModule as CommonDisasterRecoveryModule, BusinessContinuityService } from '@clinic/common';
import { DisasterRecoveryController } from './disaster-recovery.controller';

@Module({
  imports: [
    CommonDisasterRecoveryModule.register({
      isGlobal: false,
      enableBusinessContinuity: true // Enable to provide the service
    })
  ],
  controllers: [DisasterRecoveryController],
  providers: [BusinessContinuityService],
  exports: [BusinessContinuityService]
})
export class DisasterRecoveryModule {}