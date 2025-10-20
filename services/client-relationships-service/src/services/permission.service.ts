import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
