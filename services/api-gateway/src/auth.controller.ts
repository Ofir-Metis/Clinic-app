import { Controller, Post, Get, Body, Query, HttpException, HttpStatus, Headers } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Throttle } from '@nestjs/throttler';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService) {}

  @Post('register')
  @Throttle({ strict: { ttl: 900000, limit: 20 } }) // 20 registrations per 15 minutes
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
  @Throttle({ strict: { ttl: 900000, limit: 30 } }) // 30 login attempts per 15 minutes
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

  @Get('user-info')
  @Throttle({ default: { ttl: 60000, limit: 30 } }) // 30 requests per minute
  async getUserInfo(@Query('email') email: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://auth-service:3000/auth/user-info?email=${encodeURIComponent(email)}`, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('reset-request')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 reset requests per minute
  async resetRequest(@Body() body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://auth-service:3000/auth/reset-request', body, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  @Get('verify')
  @Throttle({ default: { ttl: 60000, limit: 60 } }) // 60 requests per minute
  async verifyToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('http://auth-service:3000/auth/verify', {
          headers: { authorization },
          withCredentials: true
        })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Token verification failed',
        error.response?.status || HttpStatus.UNAUTHORIZED
      );
    }
  }
} 