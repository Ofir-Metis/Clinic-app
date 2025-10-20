import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Controller for authentication routes.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('user-info')
  getUserInfo(@Query('email') email: string) {
    return this.authService.getUserByEmail(email);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Request() req: any) {
    // If we reach here, the JWT is valid (guard passed)
    return {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions || []
      },
      timestamp: new Date().toISOString()
    };
  }
}
