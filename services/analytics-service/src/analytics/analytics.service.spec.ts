import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('returns overview', () => {
    const service = new AnalyticsService();
    expect(service.overview()).toHaveProperty('totalClients');
  });
});
