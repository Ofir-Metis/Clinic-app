import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}