import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Throttle } from '@nestjs/throttler';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService) {}

  @Post('register')
  @Throttle({ strict: { ttl: 900000, limit: 3 } }) // 3 registrations per 15 minutes
  async register(@Body() body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://auth-service:3000/auth/register', body, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('login')
  @Throttle({ strict: { ttl: 900000, limit: 5 } }) // 5 login attempts per 15 minutes
  async login(@Body() body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://auth-service:3000/auth/login', body, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }
} 