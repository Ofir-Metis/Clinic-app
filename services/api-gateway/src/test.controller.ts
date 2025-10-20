import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  simpleTest() {
    return { status: 'success', message: 'Basic endpoint working', timestamp: new Date().toISOString() };
  }
}