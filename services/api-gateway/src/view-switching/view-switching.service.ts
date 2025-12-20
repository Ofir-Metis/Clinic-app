/**
 * ViewSwitchingService - Business logic for coach-client view switching
 */

import { Injectable, Logger } from '@nestjs/common';
import { JwtService, JwtPayload, TokenPair } from '@clinic/common';

export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive?: Date;
  status: 'active' | 'inactive';
  coachId: string;
}

export interface CoachInfo {
  id: string;
  name: string;
  email: string;
  specialization: string;
  avatar?: string;
}

@Injectable()
export class ViewSwitchingService {
  private readonly logger = new Logger(ViewSwitchingService.name);

  constructor(private jwtService: JwtService) {}

  /**
   * Switch coach to client view
   */
  async switchToClientView(
    coachPayload: JwtPayload,
    clientId: string,
    clientEmail: string,
  ): Promise<TokenPair> {
    try {
      // Validate coach permissions
      if (!this.jwtService.hasPermission(coachPayload, 'clients:impersonate')) {
        throw new Error('Insufficient permissions for view switching');
      }

      // Verify client access
      const canAccess = await this.canCoachAccessClient(coachPayload.sub, clientId);
      if (!canAccess) {
        throw new Error('No access to specified client');
      }

      // Generate impersonation token
      const tokens = this.jwtService.generateImpersonationToken(
        coachPayload,
        clientId,
        clientEmail
      );

      // Log the switch for audit
      this.logger.log(
        `🎭 View switch: Coach ${coachPayload.sub} → Client ${clientId}`
      );

      return tokens;
    } catch (error) {
      this.logger.error('Failed to switch to client view:', error);
      throw error;
    }
  }

  /**
   * Exit client view and return to coach view
   */
  async exitClientView(impersonationToken: string): Promise<TokenPair> {
    try {
      const tokens = await this.jwtService.exitImpersonation(impersonationToken);

      this.logger.log('🎭 Exited client view, returned to coach view');

      return tokens;
    } catch (error) {
      this.logger.error('Failed to exit client view:', error);
      throw error;
    }
  }

  /**
   * Check if coach can access specific client
   */
  async canCoachAccessClient(coachId: string, clientId: string): Promise<boolean> {
    try {
      // In a real implementation, this would query the database
      // to check coach-client relationships
      
      // Mock data for demonstration
      const coachClientRelations = await this.getCoachClientRelations(coachId);
      
      const hasAccess = coachClientRelations.some(relation => 
        relation.clientId === clientId && relation.status === 'active'
      );

      this.logger.log(
        `🔍 Access check: Coach ${coachId} → Client ${clientId}: ${hasAccess ? '✅' : '❌'}`
      );

      return hasAccess;
    } catch (error) {
      this.logger.error('Failed to check client access:', error);
      return false;
    }
  }

  /**
   * Get client information by ID
   */
  async getClientInfo(clientId: string): Promise<ClientInfo | null> {
    try {
      // Mock implementation - replace with actual database query
      const mockClients: ClientInfo[] = [
        {
          id: 'client_001',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          avatar: 'https://i.pravatar.cc/150?u=sarah',
          lastActive: new Date('2024-01-15T10:30:00Z'),
          status: 'active',
          coachId: 'coach_001',
        },
        {
          id: 'client_002', 
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          avatar: 'https://i.pravatar.cc/150?u=michael',
          lastActive: new Date('2024-01-14T14:22:00Z'),
          status: 'active',
          coachId: 'coach_001',
        },
        {
          id: 'client_003',
          name: 'Emma Rodriguez',
          email: 'emma.rodriguez@example.com',
          avatar: 'https://i.pravatar.cc/150?u=emma',
          lastActive: new Date('2024-01-13T09:15:00Z'),
          status: 'active',
          coachId: 'coach_002',
        },
      ];

      const client = mockClients.find(c => c.id === clientId);
      
      if (client) {
        this.logger.log(`📋 Retrieved client info for ${clientId}: ${client.name}`);
      }

      return client || null;
    } catch (error) {
      this.logger.error('Failed to get client info:', error);
      return null;
    }
  }

  /**
   * Get coach information by ID
   */
  async getCoachInfo(coachId: string): Promise<CoachInfo | null> {
    try {
      // Mock implementation - replace with actual database query
      const mockCoachs: CoachInfo[] = [
        {
          id: 'coach_001',
          name: 'Dr. Jennifer Smith',
          email: 'jennifer.smith@clinic.com',
          specialization: 'Cognitive Behavioral Therapy',
          avatar: 'https://i.pravatar.cc/150?u=jennifer',
        },
        {
          id: 'coach_002',
          name: 'Dr. Robert Wilson',
          email: 'robert.wilson@clinic.com',
          specialization: 'Family Therapy',
          avatar: 'https://i.pravatar.cc/150?u=robert',
        },
      ];

      const coach = mockCoachs.find(t => t.id === coachId);

      if (coach) {
        this.logger.log(`👨‍⚕️ Retrieved coach info for ${coachId}: ${coach.name}`);
      }

      return coach || null;
    } catch (error) {
      this.logger.error('Failed to get coach info:', error);
      return null;
    }
  }

  /**
   * Get all clients accessible to a coach
   */
  async getCoachClients(coachId: string): Promise<ClientInfo[]> {
    try {
      // Mock implementation - replace with actual database query
      const allClients = await this.getAllClients();
      const coachClients = allClients.filter(client => 
        client.coachId === coachId && client.status === 'active'
      );

      this.logger.log(
        `📋 Retrieved ${coachClients.length} clients for coach ${coachId}`
      );

      return coachClients;
    } catch (error) {
      this.logger.error('Failed to get coach clients:', error);
      return [];
    }
  }

  /**
   * Get coach-client relations (for access control)
   */
  private async getCoachClientRelations(coachId: string): Promise<{
    clientId: string;
    status: 'active' | 'inactive';
    assignedAt: Date;
  }[]> {
    // Mock implementation
    const relations = [
      {
        clientId: 'client_001',
        status: 'active' as const,
        assignedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        clientId: 'client_002',
        status: 'active' as const,
        assignedAt: new Date('2024-01-05T00:00:00Z'),
      },
    ];

    return coachId === 'coach_001' ? relations : [];
  }

  /**
   * Get all clients (helper method)
   */
  private async getAllClients(): Promise<ClientInfo[]> {
    // Mock data - replace with actual database query
    return [
      {
        id: 'client_001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        lastActive: new Date('2024-01-15T10:30:00Z'),
        status: 'active',
        coachId: 'coach_001',
      },
      {
        id: 'client_002',
        name: 'Michael Chen', 
        email: 'michael.chen@example.com',
        avatar: 'https://i.pravatar.cc/150?u=michael',
        lastActive: new Date('2024-01-14T14:22:00Z'),
        status: 'active',
        coachId: 'coach_001',
      },
      {
        id: 'client_003',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@example.com',
        avatar: 'https://i.pravatar.cc/150?u=emma',
        lastActive: new Date('2024-01-13T09:15:00Z'),
        status: 'active',
        coachId: 'coach_002',
      },
    ];
  }

  /**
   * Log impersonation activity for audit
   */
  async logImpersonationActivity(
    action: 'start' | 'end',
    coachId: string,
    clientId?: string,
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date(),
        action,
        coachId,
        clientId,
        source: 'view-switching-service',
      };

      // In a real implementation, this would be stored in an audit log table
      this.logger.log(`📝 Audit Log: ${JSON.stringify(logEntry)}`);
    } catch (error) {
      this.logger.error('Failed to log impersonation activity:', error);
    }
  }
}