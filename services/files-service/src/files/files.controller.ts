import { Controller, Get, Delete, Param, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly service: FilesService) {}

  @Get('upload-url/:key')
  @ApiOperation({
    summary: 'Get a pre-signed URL for file upload',
    description: 'Returns a presigned URL with file size limits. Audio/video files: 100MB max. Other files: 10MB max.',
  })
  @ApiParam({ name: 'key', description: 'Unique file key/path for the upload (must have valid extension)' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed upload URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        url: { type: 'string' },
        expiresIn: { type: 'number', description: 'URL expiration time in seconds' },
        maxSizeBytes: { type: 'number', description: 'Maximum allowed file size in bytes' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file key or unsupported file type' })
  @ApiResponse({ status: 500, description: 'S3 service unavailable or operation failed' })
  async getUploadUrl(@Param('key') key: string) {
    this.logger.log(`GET /files/upload-url/${key}`);
    const result = await this.service.uploadUrl(key);
    return {
      success: true,
      ...result,
    };
  }

  @Get('download-url/:key')
  @ApiOperation({ summary: 'Get a pre-signed URL for file download' })
  @ApiParam({ name: 'key', description: 'File key/path to download' })
  @ApiResponse({ status: 200, description: 'Pre-signed download URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file key' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 500, description: 'S3 service unavailable or operation failed' })
  async getDownloadUrl(@Param('key') key: string) {
    this.logger.log(`GET /files/download-url/${key}`);
    const result = await this.service.downloadUrl(key);
    return {
      success: true,
      ...result,
    };
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file from storage' })
  @ApiParam({ name: 'key', description: 'File key/path to delete' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file key' })
  @ApiResponse({ status: 500, description: 'S3 service unavailable or operation failed' })
  async deleteFile(@Param('key') key: string) {
    this.logger.log(`DELETE /files/${key}`);
    return this.service.deleteFile(key);
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if a file exists in storage' })
  @ApiParam({ name: 'key', description: 'File key/path to check' })
  @ApiResponse({ status: 200, description: 'File existence check completed' })
  @ApiResponse({ status: 400, description: 'Invalid file key' })
  @ApiResponse({ status: 500, description: 'S3 service unavailable or operation failed' })
  async checkFileExists(@Param('key') key: string) {
    this.logger.log(`GET /files/exists/${key}`);
    const result = await this.service.checkFileExists(key);
    return {
      success: true,
      ...result,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check S3 storage availability' })
  @ApiResponse({ status: 200, description: 'S3 status returned' })
  async checkHealth() {
    return {
      s3Available: this.service.isS3Available(),
      timestamp: new Date().toISOString(),
    };
  }
}
