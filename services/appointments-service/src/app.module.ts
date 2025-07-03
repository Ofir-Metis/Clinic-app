import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health/health.controller';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { SchedulingModule } from './scheduling/scheduling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({ pagination: { defaultLimit: 20, maxLimit: 100 } })],
    }),
    JwtModule.register({}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadEntities: true,
      synchronize: false,
    }),
    AppointmentsModule,
    PatientsModule,
    SchedulingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
