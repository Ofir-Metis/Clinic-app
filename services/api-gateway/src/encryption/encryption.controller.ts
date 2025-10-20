import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpException,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '@clinic/common';
// Note: RequireMFA may need to be implemented if required
import {
  AdvancedEncryptionService,
  TLSSecurityService,
  EncryptionInterceptor,
  RequestEncryptionInterceptor,
  FileEncryptionInterceptor
} from '@clinic/common';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

// DTOs for encryption operations
class EncryptDataDto {
  @IsString()
  data: string;

  @IsString()
  @IsOptional()
  dataType?: string;

  @IsBoolean()
  @IsOptional()
  compressionEnabled?: boolean;
}

class DecryptDataDto {
  @IsString()
  encryptedData: string;

  @IsString()
  @IsOptional()
  expectedDataType?: string;

  @IsBoolean()
  @IsOptional()
  validateMetadata?: boolean;
}

class EncryptFileDto {
  @IsString()
  inputPath: string;

  @IsString()
  outputPath: string;

  @IsBoolean()
  @IsOptional()
  deleteOriginal?: boolean;
}

class DecryptFileDto {
  @IsString()
  encryptedPath: string;

  @IsString()
  outputPath: string;

  @IsString()
  @IsOptional()
  metadataPath?: string;

  @IsBoolean()
  @IsOptional()
  deleteEncrypted?: boolean;
}

@ApiTags('Encryption Management')
@ApiBearerAuth()
@Controller('encryption')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(EncryptionInterceptor)
export class EncryptionController {
  constructor(
    private readonly encryptionService: AdvancedEncryptionService,
    private readonly tlsService: TLSSecurityService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check encryption system health' })
  @ApiResponse({ status: 200, description: 'Encryption system health status' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async getEncryptionHealth(@Request() req: any) {
    try {
      const [encryptionHealth, tlsHealth] = await Promise.all([
        this.encryptionService.healthCheck(),
        this.tlsService.validateTLSHealth()
      ]);

      return {
        status: 'success',
        data: {
          encryption: encryptionHealth,
          tls: tlsHealth,
          overall: this.calculateOverallHealth(encryptionHealth, tlsHealth),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to check encryption health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get encryption metrics' })
  @ApiResponse({ status: 200, description: 'Encryption metrics retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async getEncryptionMetrics(@Request() req: any) {
    try {
      const metrics = this.encryptionService.getMetrics();

      return {
        status: 'success',
        data: {
          metrics,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve encryption metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('certificate-info')
  @ApiOperation({ summary: 'Get TLS certificate information' })
  @ApiResponse({ status: 200, description: 'Certificate information retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async getCertificateInfo(@Request() req: any) {
    try {
      const certificateInfo = this.tlsService.getCertificateInfo();

      return {
        status: 'success',
        data: {
          certificate: certificateInfo,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve certificate information: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('security-headers')
  @ApiOperation({ summary: 'Get security headers configuration' })
  @ApiResponse({ status: 200, description: 'Security headers retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async getSecurityHeaders(@Request() req: any) {
    try {
      const securityHeaders = this.tlsService.getSecurityHeaders();

      return {
        status: 'success',
        data: {
          headers: securityHeaders,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve security headers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('encrypt')
  @ApiOperation({ summary: 'Encrypt data' })
  @ApiResponse({ status: 201, description: 'Data encrypted successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.HEALTHCARE_PROVIDER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async encryptData(
    @Body() encryptDto: EncryptDataDto,
    @Request() req: any
  ) {
    try {
      const context = {
        dataType: encryptDto.dataType,
        userId: req.user.id,
        compressionEnabled: encryptDto.compressionEnabled,
        customMetadata: {
          encryptedBy: req.user.id,
          encryptedAt: new Date().toISOString(),
          service: 'encryption-api',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      };

      const encrypted = await this.encryptionService.encryptData(
        encryptDto.data,
        context
      );

      return {
        status: 'success',
        data: {
          encrypted,
          metadata: {
            originalSize: Buffer.byteLength(encryptDto.data, 'utf8'),
            encryptedSize: Buffer.byteLength(encrypted.data, 'base64'),
            algorithm: encrypted.algorithm,
            keyVersion: encrypted.keyVersion
          }
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to encrypt data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('decrypt')
  @ApiOperation({ summary: 'Decrypt data' })
  @ApiResponse({ status: 200, description: 'Data decrypted successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.HEALTHCARE_PROVIDER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async decryptData(
    @Body() decryptDto: DecryptDataDto,
    @Request() req: any
  ) {
    try {
      // Parse encrypted data
      const encryptedData = JSON.parse(decryptDto.encryptedData);

      const context = {
        expectedDataType: decryptDto.expectedDataType,
        userId: req.user.id,
        validateMetadata: decryptDto.validateMetadata
      };

      const decrypted = await this.encryptionService.decryptData(
        encryptedData,
        context
      );

      return {
        status: 'success',
        data: {
          decrypted: decrypted.toString('utf8'),
          metadata: {
            keyVersion: encryptedData.keyVersion,
            algorithm: encryptedData.algorithm,
            originalTimestamp: encryptedData.timestamp,
            decryptedBy: req.user.id,
            decryptedAt: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to decrypt data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('encrypt-file')
  @ApiOperation({ summary: 'Encrypt file' })
  @ApiResponse({ status: 201, description: 'File encrypted successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.HEALTHCARE_PROVIDER)
  @UseInterceptors(FileEncryptionInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  async encryptFile(
    @Body() encryptFileDto: EncryptFileDto,
    @Request() req: any
  ) {
    try {
      const context = {
        deleteOriginal: encryptFileDto.deleteOriginal,
        metadata: {
          encryptedBy: req.user.id,
          encryptedAt: new Date().toISOString(),
          service: 'file-encryption-api',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      };

      const result = await this.encryptionService.encryptFile(
        encryptFileDto.inputPath,
        encryptFileDto.outputPath,
        context
      );

      return {
        status: 'success',
        data: {
          result,
          message: 'File encrypted successfully'
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to encrypt file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('decrypt-file')
  @ApiOperation({ summary: 'Decrypt file' })
  @ApiResponse({ status: 200, description: 'File decrypted successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.HEALTHCARE_PROVIDER)
  @UseInterceptors(FileEncryptionInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  async decryptFile(
    @Body() decryptFileDto: DecryptFileDto,
    @Request() req: any
  ) {
    try {
      const context = {
        deleteEncrypted: decryptFileDto.deleteEncrypted
      };

      await this.encryptionService.decryptFile(
        decryptFileDto.encryptedPath,
        decryptFileDto.outputPath,
        decryptFileDto.metadataPath,
        context
      );

      return {
        status: 'success',
        data: {
          outputPath: decryptFileDto.outputPath,
          message: 'File decrypted successfully',
          decryptedBy: req.user.id,
          decryptedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to decrypt file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('rotate-keys')
  @ApiOperation({ summary: 'Manually rotate encryption keys' })
  @ApiResponse({ status: 200, description: 'Keys rotated successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async rotateKeys(@Request() req: any) {
    try {
      await this.encryptionService.rotateKeys();

      return {
        status: 'success',
        data: {
          message: 'Encryption keys rotated successfully',
          rotatedBy: req.user.id,
          rotatedAt: new Date().toISOString(),
          newKeyVersion: this.encryptionService.getMetrics().currentKeyId
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to rotate keys: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('cipher-recommendations')
  @ApiOperation({ summary: 'Get cipher suite recommendations' })
  @ApiResponse({ status: 200, description: 'Cipher recommendations retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async getCipherRecommendations(@Request() req: any) {
    try {
      const recommendations = this.tlsService.getCipherSuiteRecommendations();

      return {
        status: 'success',
        data: {
          recommendations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve cipher recommendations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-dh-params')
  @ApiOperation({ summary: 'Generate Diffie-Hellman parameters' })
  @ApiResponse({ status: 201, description: 'DH parameters generated successfully' })
  // @RequireMFA() // TODO: Implement MFA when available
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER)
  async generateDHParams(
    @Body('keySize') keySize: 2048 | 4096 = 4096,
    @Request() req: any
  ) {
    try {
      const dhParamPath = await this.tlsService.generateDHParams(keySize);

      return {
        status: 'success',
        data: {
          dhParamPath,
          keySize,
          generatedBy: req.user.id,
          generatedAt: new Date().toISOString(),
          message: 'DH parameters generated successfully'
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate DH parameters: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('encryption-standards')
  @ApiOperation({ summary: 'Get encryption standards and compliance info' })
  @ApiResponse({ status: 200, description: 'Encryption standards retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SECURITY_OFFICER, UserRole.COMPLIANCE_OFFICER)
  async getEncryptionStandards(@Request() req: any) {
    try {
      return {
        status: 'success',
        data: {
          standards: {
            encryption: {
              algorithm: 'AES-256-GCM',
              keyLength: 256,
              keyRotation: '30 days (Healthcare)',
              compliance: ['HIPAA', 'HITECH', 'SOC2']
            },
            tls: {
              version: 'TLS 1.3',
              cipherSuites: [
                'TLS_AES_256_GCM_SHA384',
                'TLS_CHACHA20_POLY1305_SHA256',
                'TLS_AES_128_GCM_SHA256'
              ],
              perfectForwardSecrecy: true,
              ocspStapling: true
            },
            certificates: {
              keySize: 'RSA 4096 or ECDSA P-384',
              hashAlgorithm: 'SHA-256',
              validity: '1 year maximum',
              transparency: 'Certificate Transparency enabled'
            },
            compliance: {
              frameworks: ['HIPAA', 'HITECH', 'SOC2', 'ISO27001'],
              auditTrail: '7 years retention',
              keyEscrow: 'Not implemented (healthcare best practice)',
              dataClassification: 'PHI protection enabled'
            }
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve encryption standards: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Private helper methods

  private calculateOverallHealth(encryptionHealth: any, tlsHealth: any): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check encryption health
    if (encryptionHealth.status === 'critical') {
      score -= 50;
      issues.push('Critical encryption issues detected');
    } else if (encryptionHealth.status === 'warning') {
      score -= 20;
      issues.push('Encryption warnings detected');
    }

    // Check TLS health
    if (tlsHealth.status === 'critical') {
      score -= 50;
      issues.push('Critical TLS issues detected');
    } else if (tlsHealth.status === 'warning') {
      score -= 20;
      issues.push('TLS warnings detected');
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { status, score, issues };
  }
}