/**
 * ViewSwitchingService - Business logic for therapist-client view switching
 */

import { Injectable, Logger } from '@nestjs/common';
import { JwtService, JwtPayload, TokenPair } from '@clinic/common/auth/jwt.service';

export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive?: Date;
  status: 'active' | 'inactive';
  therapistId: string;
}

export interface TherapistInfo {
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
   * Switch therapist to client view
   */
  async switchToClientView(
    therapistPayload: JwtPayload,
    clientId: string,
    clientEmail: string,
  ): Promise<TokenPair> {
    try {
      // Validate therapist permissions
      if (!this.jwtService.hasPermission(therapistPayload, 'clients:impersonate')) {
        throw new Error('Insufficient permissions for view switching');
      }

      // Verify client access
      const canAccess = await this.canTherapistAccessClient(therapistPayload.sub, clientId);
      if (!canAccess) {
        throw new Error('No access to specified client');
      }

      // Generate impersonation token
      const tokens = this.jwtService.generateImpersonationToken(
        therapistPayload,
        clientId,
        clientEmail
      );

      // Log the switch for audit
      this.logger.log(
        `🎭 View switch: Therapist ${therapistPayload.sub} → Client ${clientId}`
      );

      return tokens;
    } catch (error) {
      this.logger.error('Failed to switch to client view:', error);
      throw error;
    }
  }

  /**
   * Exit client view and return to therapist view
   */
  async exitClientView(impersonationToken: string): Promise<TokenPair> {
    try {
      const tokens = await this.jwtService.exitImpersonation(impersonationToken);

      this.logger.log('🎭 Exited client view, returned to therapist view');

      return tokens;
    } catch (error) {
      this.logger.error('Failed to exit client view:', error);
      throw error;
    }
  }

  /**
   * Check if therapist can access specific client
   */
  async canTherapistAccessClient(therapistId: string, clientId: string): Promise<boolean> {
    try {
      // In a real implementation, this would query the database
      // to check therapist-client relationships
      
      // Mock data for demonstration
      const therapistClientRelations = await this.getTherapistClientRelations(therapistId);
      
      const hasAccess = therapistClientRelations.some(relation => 
        relation.clientId === clientId && relation.status === 'active'
      );

      this.logger.log(
        `🔍 Access check: Therapist ${therapistId} → Client ${clientId}: ${hasAccess ? '✅' : '❌'}`
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
          therapistId: 'therapist_001',
        },
        {
          id: 'client_002', 
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          avatar: 'https://i.pravatar.cc/150?u=michael',
          lastActive: new Date('2024-01-14T14:22:00Z'),
          status: 'active',
          therapistId: 'therapist_001',
        },
        {
          id: 'client_003',
          name: 'Emma Rodriguez',
          email: 'emma.rodriguez@example.com',
          avatar: 'https://i.pravatar.cc/150?u=emma',
          lastActive: new Date('2024-01-13T09:15:00Z'),
          status: 'active',
          therapistId: 'therapist_002',
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
   * Get therapist information by ID
   */
  async getTherapistInfo(therapistId: string): Promise<TherapistInfo | null> {
    try {
      // Mock implementation - replace with actual database query
      const mockTherapists: TherapistInfo[] = [
        {
          id: 'therapist_001',
          name: 'Dr. Jennifer Smith',
          email: 'jennifer.smith@clinic.com',
          specialization: 'Cognitive Behavioral Therapy',
          avatar: 'https://i.pravatar.cc/150?u=jennifer',
        },
        {
          id: 'therapist_002',
          name: 'Dr. Robert Wilson',
          email: 'robert.wilson@clinic.com',
          specialization: 'Family Therapy',
          avatar: 'https://i.pravatar.cc/150?u=robert',
        },
      ];

      const therapist = mockTherapists.find(t => t.id === therapistId);

      if (therapist) {
        this.logger.log(`👨‍⚕️ Retrieved therapist info for ${therapistId}: ${therapist.name}`);
      }

      return therapist || null;
    } catch (error) {
      this.logger.error('Failed to get therapist info:', error);
      return null;
    }
  }

  /**
   * Get all clients accessible to a therapist
   */
  async getTherapistClients(therapistId: string): Promise<ClientInfo[]> {
    try {
      // Mock implementation - replace with actual database query
      const allClients = await this.getAllClients();
      const therapistClients = allClients.filter(client => 
        client.therapistId === therapistId && client.status === 'active'
      );

      this.logger.log(
        `📋 Retrieved ${therapistClients.length} clients for therapist ${therapistId}`
      );

      return therapistClients;
    } catch (error) {
      this.logger.error('Failed to get therapist clients:', error);
      return [];
    }
  }

  /**
   * Get therapist-client relations (for access control)
   */
  private async getTherapistClientRelations(therapistId: string): Promise<{
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

    return therapistId === 'therapist_001' ? relations : [];
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
        therapistId: 'therapist_001',
      },
      {
        id: 'client_002',
        name: 'Michael Chen', 
        email: 'michael.chen@example.com',
        avatar: 'https://i.pravatar.cc/150?u=michael',
        lastActive: new Date('2024-01-14T14:22:00Z'),
        status: 'active',
        therapistId: 'therapist_001',
      },
      {
        id: 'client_003',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@example.com',
        avatar: 'https://i.pravatar.cc/150?u=emma',
        lastActive: new Date('2024-01-13T09:15:00Z'),
        status: 'active',
        therapistId: 'therapist_002',
      },
    ];
  }

  /**
   * Log impersonation activity for audit
   */
  async logImpersonationActivity(
    action: 'start' | 'end',
    therapistId: string,
    clientId?: string,
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date(),
        action,
        therapistId,
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