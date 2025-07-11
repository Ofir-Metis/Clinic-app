import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService) {}

  @Post('register')
  async register(@Body() body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:3000/auth/register', body, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:3000/auth/login', body, { withCredentials: true })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.response?.data || 'Auth service error', error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }
} 