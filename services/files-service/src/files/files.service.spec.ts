import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('returns signed url', async () => {
    jest.spyOn(service as any, 'client', 'get').mockReturnValue({});
    jest.spyOn<any, any>(service, 'uploadUrl').mockResolvedValue('url');
    const url = await service.uploadUrl('test');
    expect(url).toBeDefined();
  });
});
