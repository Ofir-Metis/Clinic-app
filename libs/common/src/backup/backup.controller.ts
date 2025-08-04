import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { BackupService, BackupResult } from './backup.service';

/**
 * Backup management controller for admin operations
 */
@Controller('admin/backups')
// @UseGuards(AdminGuard) // Uncomment when admin guard is available
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * Get backup service status
   */
  @Get('status')
  getStatus() {
    return this.backupService.getStatus();
  }

  /**
   * List all available backups
   */
  @Get()
  async listBackups() {
    try {
      const backups = await this.backupService.listBackups();
      return {
        backups,
        count: backups.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to list backups',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new backup
   */
  @Post('create')
  async createBackup(@Body() body?: { name?: string }) {
    try {
      const result = await this.backupService.createBackup(body?.name);
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Backup creation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to create backup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Restore from a backup
   */
  @Post('restore/:filename')
  async restoreBackup(@Param('filename') filename: string) {
    try {
      // Validate filename
      if (!filename.match(/^[a-zA-Z0-9\-_.]+\.(sql|sql\.gz)$/)) {
        throw new HttpException(
          'Invalid backup filename',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.backupService.restoreBackup(filename);
      
      if (!result.success) {
        throw new HttpException(
          result.error || 'Restore failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to restore backup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a specific backup
   */
  @Delete(':filename')
  async deleteBackup(@Param('filename') filename: string) {
    try {
      // Validate filename
      if (!filename.match(/^[a-zA-Z0-9\-_.]+\.(sql|sql\.gz)$/)) {
        throw new HttpException(
          'Invalid backup filename',
          HttpStatus.BAD_REQUEST,
        );
      }

      const success = await this.backupService.deleteBackup(filename);
      
      if (!success) {
        throw new HttpException(
          'Failed to delete backup',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to delete backup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}