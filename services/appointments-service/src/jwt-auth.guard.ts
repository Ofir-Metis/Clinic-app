import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Simple JWT authentication guard.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return false;
    const token = auth.substring(7);
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      req.user = { id: decoded.sub, roles: decoded.roles };
      return true;
    } catch {
      return false;
    }
  }
}
