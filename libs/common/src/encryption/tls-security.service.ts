import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tls from 'tls';
import * as https from 'https';
import * as constants from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface TLSConfig {
  minVersion: string;
  maxVersion: string;
  ciphers: string[];
  curves: string[];
  certificatePath: string;
  privateKeyPath: string;
  caPath?: string;
  dhParamPath?: string;
  ocspStapling: boolean;
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  certificateTransparency: boolean;
  perfectForwardSecrecy: boolean;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  serialNumber: string;
  keyUsage: string[];
  extendedKeyUsage: string[];
  subjectAltNames: string[];
  isValid: boolean;
  daysUntilExpiry: number;
}

export interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Expect-CT': string;
}

@Injectable()
export class TLSSecurityService {
  private readonly logger = new Logger(TLSSecurityService.name);
  private readonly tlsConfig: TLSConfig;
  private certificateInfo?: CertificateInfo;
  private securityHeaders: SecurityHeaders;

  constructor(private readonly configService: ConfigService) {
    try {
      // Initialize TLS config step by step to avoid undefined access
      const minVersion = this.configService.get<string>('TLS_MIN_VERSION', 'TLSv1.3');
      const maxVersion = this.configService.get<string>('TLS_MAX_VERSION', 'TLSv1.3');
      
      this.tlsConfig = {
        minVersion,
        maxVersion,
        ciphers: this.getSecureCiphers(minVersion),
        curves: this.getSecureCurves(),
        certificatePath: this.configService.get<string>('TLS_CERT_PATH', './certs/server.crt'),
        privateKeyPath: this.configService.get<string>('TLS_KEY_PATH', './certs/server.key'),
        caPath: this.configService.get<string>('TLS_CA_PATH'),
        dhParamPath: this.configService.get<string>('TLS_DH_PARAM_PATH', './certs/dhparam.pem'),
        ocspStapling: this.configService.get<boolean>('TLS_OCSP_STAPLING', true),
        hsts: {
          enabled: this.configService.get<boolean>('HSTS_ENABLED', true),
          maxAge: this.configService.get<number>('HSTS_MAX_AGE', 31536000), // 1 year
          includeSubDomains: this.configService.get<boolean>('HSTS_INCLUDE_SUBDOMAINS', true),
          preload: this.configService.get<boolean>('HSTS_PRELOAD', true)
        },
        certificateTransparency: this.configService.get<boolean>('CERT_TRANSPARENCY', true),
        perfectForwardSecrecy: this.configService.get<boolean>('PERFECT_FORWARD_SECRECY', true)
      };

      this.securityHeaders = this.generateSecurityHeaders();
      // Skip TLS initialization in development/testing environments
      if (process.env.NODE_ENV === 'production') {
        this.initializeTLS();
      }
    } catch (error) {
      this.logger.warn('TLS Security Service initialization failed, running in degraded mode:', error.message);
      // Fallback configuration
      this.tlsConfig = {
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: ['ECDHE-RSA-AES256-GCM-SHA384'],
        curves: ['prime256v1'],
        certificatePath: './certs/server.crt',
        privateKeyPath: './certs/server.key',
        ocspStapling: false,
        hsts: {
          enabled: false,
          maxAge: 0,
          includeSubDomains: false,
          preload: false
        },
        certificateTransparency: false,
        perfectForwardSecrecy: false
      };
      this.securityHeaders = {
        'Strict-Transport-Security': '',
        'Content-Security-Policy': '',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': '',
        'Expect-CT': ''
      };
    }
  }

  /**
   * Initialize TLS configuration and validate certificates
   */
  private async initializeTLS(): Promise<void> {
    try {
      // Validate certificate files exist
      await this.validateCertificateFiles();
      
      // Load and validate certificate
      this.certificateInfo = await this.loadCertificateInfo();
      
      // Configure secure TLS defaults
      this.configureSecureTLS();
      
      // Set up certificate monitoring
      this.startCertificateMonitoring();
      
      this.logger.log('TLS security service initialized successfully');
    } catch (error) {
      this.logger.warn('Failed to initialize TLS security (running in degraded mode):', error.message);
      // Don't throw error - continue with degraded security
    }
  }

  /**
   * Get HTTPS server options with secure TLS configuration
   */
  getHTTPSOptions(): https.ServerOptions {
    const options: https.ServerOptions = {
      // Certificate and key
      cert: fs.readFileSync(this.tlsConfig.certificatePath),
      key: fs.readFileSync(this.tlsConfig.privateKeyPath),
      
      // TLS version constraints
      minVersion: this.tlsConfig.minVersion as any,
      maxVersion: this.tlsConfig.maxVersion as any,
      
      // Cipher suites (only if not TLS 1.3)
      ciphers: this.tlsConfig.minVersion !== 'TLSv1.3' ? this.tlsConfig.ciphers.join(':') : undefined,
      
      // ECDH curves
      ecdhCurve: this.tlsConfig.curves.join(':'),
      
      // Perfect Forward Secrecy
      honorCipherOrder: true,
      
      // Security options
      secureProtocol: 'TLS_method',
      secureOptions: constants.SSL_OP_NO_SSLv2 | 
                    constants.SSL_OP_NO_SSLv3 | 
                    constants.SSL_OP_NO_TLSv1 | 
                    constants.SSL_OP_NO_TLSv1_1 |
                    constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
                    constants.SSL_OP_NO_COMPRESSION |
                    constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
      
      // Session management
      sessionTimeout: 300, // 5 minutes
      
      // Client certificate verification (if CA provided)
      requestCert: !!this.tlsConfig.caPath,
      rejectUnauthorized: !!this.tlsConfig.caPath,
      
      // Additional security
      handshakeTimeout: 10000, // 10 seconds
      keepAlive: true,
      keepAliveInitialDelay: 30000 // 30 seconds
    };

    // Add CA certificate if provided
    if (this.tlsConfig.caPath && fs.existsSync(this.tlsConfig.caPath)) {
      options.ca = fs.readFileSync(this.tlsConfig.caPath);
    }

    // Add DH parameters if provided
    if (this.tlsConfig.dhParamPath && fs.existsSync(this.tlsConfig.dhParamPath)) {
      options.dhparam = fs.readFileSync(this.tlsConfig.dhParamPath);
    }

    return options;
  }

  /**
   * Get security headers for HTTP responses
   */
  getSecurityHeaders(): SecurityHeaders {
    return { ...this.securityHeaders };
  }

  /**
   * Get certificate information
   */
  getCertificateInfo(): CertificateInfo | undefined {
    return this.certificateInfo;
  }

  /**
   * Validate TLS configuration and certificate health
   */
  async validateTLSHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: Record<string, any>;
  }> {
    const issues: string[] = [];
    
    try {
      // Check certificate validity
      if (!this.certificateInfo) {
        issues.push('Certificate information not loaded');
      } else {
        if (!this.certificateInfo.isValid) {
          issues.push('Certificate is not valid');
        }
        
        if (this.certificateInfo.daysUntilExpiry < 30) {
          issues.push(`Certificate expires in ${this.certificateInfo.daysUntilExpiry} days`);
        }
        
        if (this.certificateInfo.daysUntilExpiry < 0) {
          issues.push('Certificate has expired');
        }
      }

      // Check file permissions
      const certStat = fs.statSync(this.tlsConfig.certificatePath);
      const keyStat = fs.statSync(this.tlsConfig.privateKeyPath);
      
      if ((keyStat.mode & 0o077) !== 0) {
        issues.push('Private key has overly permissive permissions');
      }

      // Validate TLS configuration
      if (this.tlsConfig.minVersion !== 'TLSv1.3' && this.tlsConfig.minVersion !== 'TLSv1.2') {
        issues.push(`Insecure TLS version: ${this.tlsConfig.minVersion}`);
      }

      // Test TLS connection (if possible)
      const connectionTest = await this.testTLSConnection();
      if (!connectionTest.success) {
        issues.push(`TLS connection test failed: ${connectionTest.error}`);
      }

    } catch (error) {
      issues.push(`TLS validation error: ${error.message}`);
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.some(i => i.includes('expired') || i.includes('failed')) ? 'critical' : 'warning';

    return {
      status,
      details: {
        issues,
        certificateInfo: this.certificateInfo,
        tlsConfig: {
          minVersion: this.tlsConfig.minVersion,
          maxVersion: this.tlsConfig.maxVersion,
          cipherSuites: this.tlsConfig.ciphers.length,
          curves: this.tlsConfig.curves.length,
          hstsEnabled: this.tlsConfig.hsts.enabled,
          ocspStapling: this.tlsConfig.ocspStapling
        }
      }
    };
  }

  /**
   * Generate DH parameters for Perfect Forward Secrecy
   */
  async generateDHParams(keySize: 2048 | 4096 = 4096): Promise<string> {
    this.logger.log(`Generating DH parameters (${keySize} bits)...`);
    
    return new Promise((resolve, reject) => {
      const proc = require('child_process').spawn('openssl', [
        'dhparam',
        '-out', this.tlsConfig.dhParamPath,
        keySize.toString()
      ]);

      proc.on('close', (code: number) => {
        if (code === 0) {
          this.logger.log('DH parameters generated successfully');
          resolve(this.tlsConfig.dhParamPath);
        } else {
          reject(new Error(`DH parameter generation failed with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Rotate TLS certificates
   */
  async rotateCertificates(
    newCertPath: string,
    newKeyPath: string,
    backupOld: boolean = true
  ): Promise<void> {
    try {
      this.logger.log('Starting certificate rotation...');

      // Backup old certificates if requested
      if (backupOld) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(this.tlsConfig.certificatePath, `${this.tlsConfig.certificatePath}.backup-${timestamp}`);
        fs.copyFileSync(this.tlsConfig.privateKeyPath, `${this.tlsConfig.privateKeyPath}.backup-${timestamp}`);
      }

      // Validate new certificates
      const tempCertInfo = await this.loadCertificateInfo(newCertPath);
      if (!tempCertInfo.isValid) {
        throw new Error('New certificate is not valid');
      }

      // Replace certificates
      fs.copyFileSync(newCertPath, this.tlsConfig.certificatePath);
      fs.copyFileSync(newKeyPath, this.tlsConfig.privateKeyPath);

      // Update certificate info
      this.certificateInfo = tempCertInfo;

      this.logger.log('Certificate rotation completed successfully');

    } catch (error) {
      this.logger.error('Certificate rotation failed:', error);
      throw error;
    }
  }

  /**
   * Get cipher suite recommendations
   */
  getCipherSuiteRecommendations(): {
    recommended: string[];
    deprecated: string[];
    insecure: string[];
  } {
    return {
      recommended: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ],
      deprecated: [
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'AES256-GCM-SHA384',
        'AES128-GCM-SHA256'
      ],
      insecure: [
        'RC4',
        'DES',
        '3DES',
        'MD5',
        'SHA1',
        'NULL',
        'EXPORT',
        'LOW',
        'MEDIUM'
      ]
    };
  }

  // Private helper methods

  private getSecureCiphers(minVersion?: string): string[] {
    // TLS 1.3 cipher suites (if supported)
    const tls13Ciphers = [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256'
    ];

    // TLS 1.2 cipher suites (fallback)
    const tls12Ciphers = [
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES128-SHA256'
    ];

    const version = minVersion || this.tlsConfig?.minVersion || 'TLSv1.2';
    return version === 'TLSv1.3' ? tls13Ciphers : tls12Ciphers;
  }

  private getSecureCurves(): string[] {
    return [
      'X25519',
      'prime256v1',
      'secp384r1',
      'secp521r1'
    ];
  }

  private generateSecurityHeaders(): SecurityHeaders {
    const hsts = this.tlsConfig.hsts.enabled 
      ? `max-age=${this.tlsConfig.hsts.maxAge}${this.tlsConfig.hsts.includeSubDomains ? '; includeSubDomains' : ''}${this.tlsConfig.hsts.preload ? '; preload' : ''}`
      : '';

    return {
      'Strict-Transport-Security': hsts,
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; media-src 'none'; object-src 'none'; child-src 'none'; worker-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()',
      'Expect-CT': 'max-age=86400, enforce'
    };
  }

  private async validateCertificateFiles(): Promise<void> {
    const files = [
      { path: this.tlsConfig.certificatePath, name: 'Certificate' },
      { path: this.tlsConfig.privateKeyPath, name: 'Private Key' }
    ];

    for (const file of files) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`${file.name} file not found: ${file.path}`);
      }

      const stats = fs.statSync(file.path);
      if (!stats.isFile()) {
        throw new Error(`${file.name} is not a file: ${file.path}`);
      }

      // Check private key permissions
      if (file.name === 'Private Key' && (stats.mode & 0o077) !== 0) {
        this.logger.warn(`Private key has overly permissive permissions: ${file.path}`);
      }
    }
  }

  private async loadCertificateInfo(certPath?: string): Promise<CertificateInfo> {
    const certificatePath = certPath || this.tlsConfig.certificatePath;
    const certPem = fs.readFileSync(certificatePath, 'utf8');
    
    // Parse certificate using Node.js crypto
    const cert = new crypto.X509Certificate(certPem);
    
    const validFrom = new Date(cert.validFrom);
    const validTo = new Date(cert.validTo);
    const now = new Date();
    
    const isValid = now >= validFrom && now <= validTo;
    const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      subject: cert.subject,
      issuer: cert.issuer,
      validFrom,
      validTo,
      fingerprint: cert.fingerprint,
      serialNumber: cert.serialNumber,
      keyUsage: cert.keyUsage || [],
      extendedKeyUsage: (cert as any).extendedKeyUsage || [],
      subjectAltNames: cert.subjectAltName ? cert.subjectAltName.split(', ') : [],
      isValid,
      daysUntilExpiry
    };
  }

  private configureSecureTLS(): void {
    // Note: TLS defaults are read-only in newer Node.js versions
    // Configuration is applied per connection instead
    
    // Configure secure context defaults
    const secureContext = tls.createSecureContext({
      cert: fs.readFileSync(this.tlsConfig.certificatePath),
      key: fs.readFileSync(this.tlsConfig.privateKeyPath),
      ciphers: this.tlsConfig.ciphers.join(':'),
      ecdhCurve: this.tlsConfig.curves.join(':'),
      honorCipherOrder: true,
      secureProtocol: 'TLS_method',
      secureOptions: constants.SSL_OP_NO_SSLv2 | 
                    constants.SSL_OP_NO_SSLv3 | 
                    constants.SSL_OP_NO_TLSv1 | 
                    constants.SSL_OP_NO_TLSv1_1
    });
  }

  private startCertificateMonitoring(): void {
    // Check certificate expiry daily
    setInterval(async () => {
      try {
        if (this.certificateInfo && this.certificateInfo.daysUntilExpiry <= 30) {
          this.logger.warn(`Certificate expires in ${this.certificateInfo.daysUntilExpiry} days`);
        }
      } catch (error) {
        this.logger.error('Certificate monitoring error:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async testTLSConnection(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 443,
        method: 'GET',
        timeout: 5000,
        ...this.getHTTPSOptions()
      };

      const req = https.request(options, (res) => {
        resolve({ success: true });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      req.end();
    });
  }
}