import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { ResetToken } from '../entities/reset-token.entity';
import { ResetController } from './reset.controller';
import { ResetService } from './reset.service';
import { JwtStrategy } from './jwt.strategy';
import { MFAModule } from '@clinic/common';
import { MFAController } from '../mfa/mfa.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, ResetToken]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
          issuer: 'clinic-app',
          audience: 'clinic-users'
        },
      }),
      inject: [ConfigService],
    }),
    // MFA Module integration
    MFAModule.registerAsync({
      isGlobal: false,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        issuer: configService.get<string>('MFA_ISSUER', 'Clinic Management Platform'),
        serviceName: configService.get<string>('MFA_SERVICE_NAME', 'Clinic Auth'),
        window: configService.get<number>('MFA_WINDOW', 1),
        backupCodeCount: configService.get<number>('MFA_BACKUP_CODE_COUNT', 10),
        backupCodeLength: configService.get<number>('MFA_BACKUP_CODE_LENGTH', 8),
        encryptionKey: configService.get<string>('MFA_ENCRYPTION_KEY')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [AuthService, ResetService, JwtStrategy],
  controllers: [AuthController, ResetController, MFAController],
})
export class AuthModule { }
