/**
 * Authentication types and interfaces
 */

export interface User {
  id: string;
  sub: string; // Same as id, for JWT compatibility
  email: string;
  role: 'coach' | 'client' | 'admin' | 'super_admin';
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // MFA properties
  mfaEnabled?: boolean;
  mfaSecret?: string;
  
  // Session properties
  sessionId?: string;
  
  // Additional properties for compatibility
  [key: string]: any;
}

export interface AuthenticatedRequest {
  user: User;
  sessionId?: string;
  sessionID?: string; // For compatibility
}

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      sessionID?: string;
    }
  }
}