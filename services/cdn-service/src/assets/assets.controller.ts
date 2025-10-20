import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  Query, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  Response,
  Header,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '@clinic/common';
import { AssetsService } from './assets.service';
import { Response as ExpressResponse } from 'express';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload asset to CDN' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Asset uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
    @Query('optimize') optimize?: string,
    @Query('variants') variants?: string,
    @Query('customKey') customKey?: string,
  ) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const options = {
      folder,
      optimize: optimize === 'true',
      variants: variants ? variants.split(',') : undefined,
      customKey,
    };

    return this.assetsService.uploadAsset(file.buffer, file.originalname, options);
  }

  @Get(':key(*)')
  @ApiOperation({ summary: 'Get asset by key' })
  @ApiParam({ name: 'key', description: 'Asset key (can contain slashes)' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  async getAsset(
    @Param('key') key: string,
    @Response() res: ExpressResponse,
    @Query('download') download?: string,
  ) {
    try {
      const { buffer, info } = await this.assetsService.getAsset(key);

      // Set caching headers
      res.set({
        'Content-Type': info.contentType,
        'Content-Length': buffer.length.toString(),
        'ETag': info.etag,
        'Last-Modified': info.lastModified.toUTCString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      });

      // Handle download vs inline display
      if (download === 'true') {
        const filename = key.split('/').pop() || 'download';
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.set('Content-Disposition', 'inline');
      }

      res.send(buffer);
    } catch (error) {
      throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('info/:key(*)')
  @ApiOperation({ summary: 'Get asset metadata' })
  @ApiParam({ name: 'key', description: 'Asset key (can contain slashes)' })
  @ApiResponse({ status: 200, description: 'Asset metadata retrieved successfully' })
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getAssetInfo(@Param('key') key: string) {
    const info = await this.assetsService.getAssetInfo(key);
    
    if (!info) {
      throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...info,
      url: this.assetsService.getAssetUrl(key),
    };
  }

  @Delete(':key(*)')
  @ApiOperation({ summary: 'Delete asset by key' })
  @ApiParam({ name: 'key', description: 'Asset key (can contain slashes)' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @Roles(UserRole.ADMIN)
  async deleteAsset(@Param('key') key: string) {
    const exists = await this.assetsService.assetExists(key);
    
    if (!exists) {
      throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
    }

    await this.assetsService.deleteAsset(key);
    
    return { message: 'Asset deleted successfully', key };
  }

  @Post('invalidate')
  @ApiOperation({ summary: 'Invalidate CDN cache for specific assets' })
  @ApiResponse({ status: 200, description: 'Cache invalidation initiated' })
  @Roles(UserRole.ADMIN)
  async invalidateCache(@Query('keys') keys: string) {
    if (!keys) {
      throw new HttpException('No keys provided', HttpStatus.BAD_REQUEST);
    }

    const keyList = keys.split(',').map(key => key.trim());
    const invalidationId = await this.assetsService.invalidateCache(keyList);
    
    return {
      message: 'Cache invalidation initiated',
      invalidationId,
      keys: keyList,
    };
  }

  @Get('url/:key(*)')
  @ApiOperation({ summary: 'Get CDN URL for asset' })
  @ApiParam({ name: 'key', description: 'Asset key (can contain slashes)' })
  @ApiResponse({ status: 200, description: 'Asset URL retrieved successfully' })
  @Roles(UserRole.CLIENT, UserRole.COACH, UserRole.ADMIN)
  async getAssetUrl(@Param('key') key: string) {
    const url = this.assetsService.getAssetUrl(key);
    
    return { key, url };
  }
}