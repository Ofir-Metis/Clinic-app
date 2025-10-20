import { AnalyticsService } from './analytics.service';
import { DataSource } from 'typeorm';
import { StructuredLoggerService } from '@clinic/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockLogger: jest.Mocked<StructuredLoggerService>;

  beforeEach(() => {
    mockDataSource = {} as jest.Mocked<DataSource>;
    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<StructuredLoggerService>;
    service = new AnalyticsService(mockDataSource, mockLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
