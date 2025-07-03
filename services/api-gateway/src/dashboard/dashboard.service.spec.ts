import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { of } from 'rxjs';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [DashboardService],
    }).compile();
    service = module.get(DashboardService);
  });

  it('fetches stats', async () => {
    jest.spyOn(service['http'], 'get').mockReturnValue(of({ data: {} }) as any);
    const result = await service.stats();
    expect(result).toEqual({});
  });
});
