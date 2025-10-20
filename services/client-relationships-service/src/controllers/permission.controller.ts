import { Controller, Get, Param } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  findAll() {
    return { message: 'Get all permissions' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get permission ${id}` };
  }
}
