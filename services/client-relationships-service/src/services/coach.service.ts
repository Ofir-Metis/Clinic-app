import { Injectable } from '@nestjs/common';

@Injectable()
export class CoachService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
