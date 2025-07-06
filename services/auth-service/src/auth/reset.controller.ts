import { Controller, Post, Body } from '@nestjs/common';
import { ResetService } from './reset.service';

@Controller('auth/reset')
export class ResetController {
  constructor(private readonly service: ResetService) {}

  @Post('request')
  async request(@Body('email') email: string) {
    await this.service.requestReset(email);
    return { message: 'ok' };
  }

  @Post('confirm')
  async confirm(@Body() body: { token: string; password: string }) {
    await this.service.confirmReset(body.token, body.password);
    return { message: 'ok' };
  }
}
