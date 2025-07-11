import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiService } from './openai.service';

describe('OpenaiService', () => {
  let service: OpenaiService;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenaiService],
    }).compile();
    service = module.get<OpenaiService>(OpenaiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
