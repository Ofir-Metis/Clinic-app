import { Controller, Get, Param } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Get('upload-url/:key')
  getUploadUrl(@Param('key') key: string) {
    return this.service.uploadUrl(key);
  }
}
