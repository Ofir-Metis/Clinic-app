import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  backupPath: string;
  s3Bucket?: string;
  s3Region?: string;
  encryptionKey?: string;
  compressionLevel: number;
}

export interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly config: BackupConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      enabled: this.configService.get('BACKUP_ENABLED', 'true') === 'true',
      schedule: this.configService.get('BACKUP_SCHEDULE', '0 2 * * *'), // Daily at 2 AM
      retentionDays: parseInt(this.configService.get('BACKUP_RETENTION_DAYS', '30')),
      backupPath: this.configService.get('BACKUP_PATH', '/backups'),
      s3Bucket: this.configService.get('BACKUP_S3_BUCKET'),
      s3Region: this.configService.get('BACKUP_S3_REGION', 'us-east-1'),
      encryptionKey: this.configService.get('BACKUP_ENCRYPTION_KEY'),
      compressionLevel: parseInt(this.configService.get('BACKUP_COMPRESSION_LEVEL', '6')),
    };

    if (this.config.enabled) {
      this.logger.log('Backup service initialized with schedule: ' + this.config.schedule);
    } else {
      this.logger.log('Backup service disabled');
    }
  }

  /**
   * Scheduled backup job - runs automatically
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      this.logger.log('Starting scheduled database backup...');
      const result = await this.createBackup();
      
      if (result.success) {
        this.logger.log(`Backup completed successfully: ${result.filename} (${result.size} bytes)`);
        
        // Upload to cloud storage if configured
        if (this.config.s3Bucket) {
          await this.uploadToS3(result.filename);
        }
        
        // Clean up old backups
        await this.cleanupOldBackups();
      } else {
        this.logger.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error('Scheduled backup failed:', error);
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(customName?: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = customName || `clinic-db-backup-${timestamp}.sql.gz`;
      const backupPath = path.join(this.config.backupPath, filename);

      // Build pg_dump command
      const dumpCommand = this.buildDumpCommand(backupPath);
      
      this.logger.log(`Creating backup: ${filename}`);
      
      // Execute backup
      const { stdout, stderr } = await execAsync(dumpCommand);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`);
      }

      // Get file size
      const stats = await fs.stat(backupPath);
      const duration = Date.now() - startTime;

      // Verify backup integrity
      await this.verifyBackup(backupPath);

      return {
        success: true,
        filename,
        size: stats.size,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Backup creation failed: ${error.message}`);
      
      return {
        success: false,
        filename: '',
        size: 0,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFilename: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      const backupPath = path.join(this.config.backupPath, backupFilename);
      
      // Verify backup file exists
      await fs.access(backupPath);
      
      this.logger.log(`Restoring from backup: ${backupFilename}`);
      
      // Build restore command
      const restoreCommand = this.buildRestoreCommand(backupPath);
      
      // Execute restore
      const { stdout, stderr } = await execAsync(restoreCommand);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_restore error: ${stderr}`);
      }

      const duration = Date.now() - startTime;
      
      this.logger.log(`Restore completed successfully in ${duration}ms`);
      
      return {
        success: true,
        filename: backupFilename,
        size: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Restore failed: ${error.message}`);
      
      return {
        success: false,
        filename: backupFilename,
        size: 0,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
    try {
      const files = await fs.readdir(this.config.backupPath);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.sql.gz') || file.endsWith('.sql')) {
          const filePath = path.join(this.config.backupPath, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            filename: file,
            size: stats.size,
            created: stats.birthtime,
          });
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.config.backupPath, filename);
      await fs.unlink(backupPath);
      
      this.logger.log(`Backup deleted: ${filename}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete backup ${filename}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get backup service status
   */
  getStatus(): any {
    return {
      enabled: this.config.enabled,
      schedule: this.config.schedule,
      retentionDays: this.config.retentionDays,
      backupPath: this.config.backupPath,
      s3Enabled: !!this.config.s3Bucket,
      encryptionEnabled: !!this.config.encryptionKey,
    };
  }

  /**
   * Build pg_dump command
   */
  private buildDumpCommand(outputPath: string): string {
    const dbConfig = {
      host: this.configService.get('POSTGRES_HOST', 'localhost'),
      port: this.configService.get('POSTGRES_PORT', '5432'),
      username: this.configService.get('POSTGRES_USER', 'postgres'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      database: this.configService.get('POSTGRES_DB', 'clinic'),
    };

    // Build pg_dump command with compression
    let command = `PGPASSWORD="${dbConfig.password}" pg_dump`;
    command += ` -h ${dbConfig.host}`;
    command += ` -p ${dbConfig.port}`;
    command += ` -U ${dbConfig.username}`;
    command += ` -d ${dbConfig.database}`;
    command += ` --no-password`;
    command += ` --verbose`;
    command += ` --clean`;
    command += ` --create`;
    command += ` --if-exists`;
    command += ` | gzip -${this.config.compressionLevel} > "${outputPath}"`;

    return command;
  }

  /**
   * Build pg_restore command
   */
  private buildRestoreCommand(backupPath: string): string {
    const dbConfig = {
      host: this.configService.get('POSTGRES_HOST', 'localhost'),
      port: this.configService.get('POSTGRES_PORT', '5432'),
      username: this.configService.get('POSTGRES_USER', 'postgres'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      database: this.configService.get('POSTGRES_DB', 'clinic'),
    };

    // Build restore command
    let command = `gunzip -c "${backupPath}" |`;
    command += ` PGPASSWORD="${dbConfig.password}" psql`;
    command += ` -h ${dbConfig.host}`;
    command += ` -p ${dbConfig.port}`;
    command += ` -U ${dbConfig.username}`;
    command += ` -d ${dbConfig.database}`;

    return command;
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.config.backupPath);
    } catch (error) {
      await fs.mkdir(this.config.backupPath, { recursive: true });
      this.logger.log(`Created backup directory: ${this.config.backupPath}`);
    }
  }

  /**
   * Verify backup integrity
   */
  private async verifyBackup(backupPath: string): Promise<void> {
    try {
      // Test if the gzipped file can be read
      const { stdout, stderr } = await execAsync(`gunzip -t "${backupPath}"`);
      
      if (stderr) {
        throw new Error(`Backup verification failed: ${stderr}`);
      }
      
      this.logger.debug(`Backup verification passed: ${backupPath}`);
    } catch (error) {
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  /**
   * Upload backup to S3
   */
  private async uploadToS3(filename: string): Promise<void> {
    if (!this.config.s3Bucket) {
      return;
    }

    try {
      const AWS = await import('aws-sdk');
      const s3 = new AWS.S3({ region: this.config.s3Region });
      
      const backupPath = path.join(this.config.backupPath, filename);
      const fileContent = await fs.readFile(backupPath);
      
      const uploadParams = {
        Bucket: this.config.s3Bucket,
        Key: `backups/${filename}`,
        Body: fileContent,
        StorageClass: 'STANDARD_IA', // Infrequent Access for cost optimization
        ServerSideEncryption: 'AES256',
      };

      await s3.upload(uploadParams).promise();
      
      this.logger.log(`Backup uploaded to S3: s3://${this.config.s3Bucket}/backups/${filename}`);
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      
      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          const success = await this.deleteBackup(backup.filename);
          if (success) {
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error) {
      this.logger.error(`Backup cleanup failed: ${error.message}`);
    }
  }
}