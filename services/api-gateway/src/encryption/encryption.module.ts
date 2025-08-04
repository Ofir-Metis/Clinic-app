import { Module } from '@nestjs/common';
import { HealthcareEncryptionModule } from '@clinic/common';
import { EncryptionController } from './encryption.controller';

@Module({
  imports: [
    // Import healthcare-specific encryption module with HIPAA defaults
    HealthcareEncryptionModule.registerAsync({
      isGlobal: false,
      useFactory: () => ({
        // Healthcare-grade encryption settings
        encryptionAlgorithm: 'aes-256-gcm',
        keyRotationDays: 30, // Monthly rotation for healthcare compliance
        compressionEnabled: true,
        
        // TLS 1.3 only for maximum security
        tlsMinVersion: 'TLSv1.3',
        tlsMaxVersion: 'TLSv1.3',
        
        // Healthcare certificate paths
        certificatePath: process.env.HEALTHCARE_TLS_CERT_PATH || './certs/healthcare-server.crt',
        privateKeyPath: process.env.HEALTHCARE_TLS_KEY_PATH || './certs/healthcare-server.key',
        
        // Strict HSTS for healthcare (2 years)
        hstsEnabled: true,
        hstsMaxAge: 63072000,
        
        // Advanced security features
        ocspStapling: true,
        perfectForwardSecrecy: true
      })
    })
  ],
  controllers: [EncryptionController],
  exports: []
})
export class EncryptionModule {}