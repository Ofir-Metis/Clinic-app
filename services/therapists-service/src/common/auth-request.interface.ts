import { Request } from 'express';

/**
 * Express request augmented with authenticated user information.
 */
export interface AuthRequest extends Request {
  user: {
    id: number;
    roles: string[];
  };
}
