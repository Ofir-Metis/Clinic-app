import { Controller, Get } from '@nestjs/common';

@Controller('test-recordings')
export class TestRecordingController {
  @Get()
  test() {
    return { message: 'Test recording endpoint working' };
  }
}