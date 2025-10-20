import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt'; // Using MockJwtService instead
import { HealthController } from './health/health.controller';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { PatientAppointmentsModule } from './patient-appointments/patient-appointments.module';
import { CommonModule } from '@clinic/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MockJwtService } from './mock-jwt.service';

@Module({
  imports: [
    // Use CommonModule for enterprise-grade configuration
    CommonModule,
    
    // JWT Module replaced with MockJwtService for now
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET || 'fallback-secret-for-development',
    //   signOptions: { expiresIn: '24h' },
    //   global: true, // Make JwtService globally available
    // }),
    
    AppointmentsModule,
    PatientsModule,
    SchedulingModule,
    PatientAppointmentsModule,
  ],
  controllers: [HealthController],
  providers: [MockJwtService, JwtAuthGuard],
  exports: [JwtAuthGuard]
})
export class AppModule {}
