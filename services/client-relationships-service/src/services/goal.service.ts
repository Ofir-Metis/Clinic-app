import { Injectable } from '@nestjs/common';

@Injectable()
export class GoalService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
