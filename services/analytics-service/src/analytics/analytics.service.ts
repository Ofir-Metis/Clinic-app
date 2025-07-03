import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  overview() {
    return { totalClients: 0, sessionsThisWeek: 0, pendingTasks: 0 };
  }
}
