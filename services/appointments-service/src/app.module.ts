import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClientsModule } from './clients/clients.module';
import { ClientAppointmentsModule } from './client-appointments/client-appointments.module';
import { ConsentModule } from './consent/consent.module';
import { RecordingModule } from './recording/recording.module';
import { AuthModule } from './auth.module';
import { CommonModule } from '@clinic/common';

@Module({
  imports: [
    CommonModule,
    AuthModule, // Global - provides MockJwtService & JwtAuthGuard to all modules
    AppointmentsModule,
    ClientsModule,
    ClientAppointmentsModule,
    ConsentModule,
    RecordingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
