import { Injectable } from '@nestjs/common';

@Injectable()
export class AchievementService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }
}
