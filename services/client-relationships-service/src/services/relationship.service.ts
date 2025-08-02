/**
 * RelationshipService - Core service for managing client-coach relationships
 * Handles relationship creation, updates, permissions, and data access control
 */

import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { 
  ClientCoachRelationship, 
  RelationshipStatus, 
  RelationshipType, 
  DataAccessLevel 
} from '../entities/client-coach-relationship.entity';
import { Client } from '../entities/client.entity';
import { Coach } from '../entities/coach.entity';
import { RelationshipPermission, PermissionType, PermissionScope } from '../entities/relationship-permission.entity';

export interface CreateRelationshipDto {
  clientId: string;
  coachId: string;
  relationshipType: RelationshipType;
  dataAccessLevel: DataAccessLevel;
  focusAreas?: string[];
  specialization?: string;
  coachingPreferences?: any;
  privacySettings?: any;
  programDetails?: any;
  invitedBy: string;
  invitationMessage?: string;
}

export interface UpdateRelationshipDto {
  status?: RelationshipStatus;
  relationshipType?: RelationshipType;
  dataAccessLevel?: DataAccessLevel;
  focusAreas?: string[];
  specialization?: string;
  coachingPreferences?: any;
  privacySettings?: any;
  programDetails?: any;
  notes?: string;
  tags?: string[];
}

export interface RelationshipQueryDto {
  clientId?: string;
  coachId?: string;
  status?: RelationshipStatus;
  relationshipType?: RelationshipType;
  dataAccessLevel?: DataAccessLevel;
  focusAreas?: string[];
  includeInactive?: boolean;
}

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    @InjectRepository(ClientCoachRelationship)
    private relationshipRepository: Repository<ClientCoachRelationship>,
    
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
    
    @InjectRepository(RelationshipPermission)
    private permissionRepository: Repository<RelationshipPermission>,
  ) {}

  /**
   * Create a new client-coach relationship
   */
  async createRelationship(createDto: CreateRelationshipDto): Promise<ClientCoachRelationship> {
    this.logger.log(`Creating relationship between client ${createDto.clientId} and coach ${createDto.coachId}`);

    // Verify client and coach exist
    const client = await this.clientRepository.findOne({ where: { id: createDto.clientId } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${createDto.clientId} not found`);
    }

    const coach = await this.coachRepository.findOne({ where: { id: createDto.coachId } });
    if (!coach) {
      throw new NotFoundException(`Coach with ID ${createDto.coachId} not found`);
    }

    // Check if relationship already exists
    const existingRelationship = await this.relationshipRepository.findOne({
      where: {
        clientId: createDto.clientId,
        coachId: createDto.coachId,
        status: In([RelationshipStatus.PENDING, RelationshipStatus.ACTIVE])
      }
    });

    if (existingRelationship) {
      throw new BadRequestException('An active or pending relationship already exists between this client and coach');
    }

    // Check coach availability
    if (!coach.canAcceptNewClients()) {
      throw new BadRequestException('Coach is not accepting new clients');
    }

    // Create the relationship
    const relationship = this.relationshipRepository.create({
      ...createDto,
      status: RelationshipStatus.PENDING,
      invitationSentDate: new Date(),
    });

    const savedRelationship = await this.relationshipRepository.save(relationship);

    // Create default permissions based on relationship type and data access level
    await this.createDefaultPermissions(savedRelationship);

    // TODO: Send invitation notification via NATS
    // await this.notificationService.sendRelationshipInvitation(savedRelationship);

    this.logger.log(`Relationship created with ID: ${savedRelationship.id}`);
    return savedRelationship;
  }

  /**
   * Accept a pending relationship invitation
   */
  async acceptRelationship(relationshipId: string, acceptedBy: string): Promise<ClientCoachRelationship> {
    const relationship = await this.findById(relationshipId);
    
    if (relationship.status !== RelationshipStatus.PENDING) {
      throw new BadRequestException('Relationship is not in pending status');
    }

    relationship.status = RelationshipStatus.ACTIVE;
    relationship.relationshipStarted = new Date();
    relationship.invitationAcceptedDate = new Date();

    return this.relationshipRepository.save(relationship);
  }

  /**
   * Reject a pending relationship invitation
   */
  async rejectRelationship(relationshipId: string, rejectedBy: string, reason?: string): Promise<ClientCoachRelationship> {
    const relationship = await this.findById(relationshipId);
    
    if (relationship.status !== RelationshipStatus.PENDING) {
      throw new BadRequestException('Relationship is not in pending status');
    }

    relationship.status = RelationshipStatus.TERMINATED;
    relationship.relationshipEnded = new Date();
    relationship.terminationReason = reason || 'Invitation rejected';
    relationship.terminatedBy = rejectedBy;

    return this.relationshipRepository.save(relationship);
  }

  /**
   * Update an existing relationship
   */
  async updateRelationship(relationshipId: string, updateDto: UpdateRelationshipDto): Promise<ClientCoachRelationship> {
    const relationship = await this.findById(relationshipId);

    // Handle status changes
    if (updateDto.status && updateDto.status !== relationship.status) {
      await this.handleStatusChange(relationship, updateDto.status);
    }

    // Update other fields
    Object.assign(relationship, updateDto);

    return this.relationshipRepository.save(relationship);
  }

  /**
   * Terminate a relationship
   */
  async terminateRelationship(
    relationshipId: string, 
    terminatedBy: string, 
    reason?: string
  ): Promise<ClientCoachRelationship> {
    const relationship = await this.findById(relationshipId);

    if (relationship.status === RelationshipStatus.TERMINATED) {
      throw new BadRequestException('Relationship is already terminated');
    }

    relationship.status = RelationshipStatus.TERMINATED;
    relationship.relationshipEnded = new Date();
    relationship.terminatedBy = terminatedBy;
    relationship.terminationReason = reason;

    // Revoke all permissions
    const permissions = await this.permissionRepository.find({
      where: { relationshipId }
    });

    for (const permission of permissions) {
      permission.revoke(terminatedBy, 'Relationship terminated');
    }

    await this.permissionRepository.save(permissions);

    return this.relationshipRepository.save(relationship);
  }

  /**
   * Find relationship by ID with relations
   */
  async findById(relationshipId: string, includeRelations = true): Promise<ClientCoachRelationship> {
    const queryBuilder = this.relationshipRepository.createQueryBuilder('relationship');

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('relationship.client', 'client')
        .leftJoinAndSelect('relationship.coach', 'coach')
        .leftJoinAndSelect('relationship.permissions', 'permissions')
        .leftJoinAndSelect('relationship.sharedGoals', 'sharedGoals');
    }

    const relationship = await queryBuilder
      .where('relationship.id = :id', { id: relationshipId })
      .getOne();

    if (!relationship) {
      throw new NotFoundException(`Relationship with ID ${relationshipId} not found`);
    }

    return relationship;
  }

  /**
   * Find relationships by query parameters
   */
  async findRelationships(queryDto: RelationshipQueryDto): Promise<ClientCoachRelationship[]> {
    const queryBuilder = this.relationshipRepository.createQueryBuilder('relationship')
      .leftJoinAndSelect('relationship.client', 'client')
      .leftJoinAndSelect('relationship.coach', 'coach')
      .leftJoinAndSelect('relationship.permissions', 'permissions');

    if (queryDto.clientId) {
      queryBuilder.andWhere('relationship.clientId = :clientId', { clientId: queryDto.clientId });
    }

    if (queryDto.coachId) {
      queryBuilder.andWhere('relationship.coachId = :coachId', { coachId: queryDto.coachId });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('relationship.status = :status', { status: queryDto.status });
    } else if (!queryDto.includeInactive) {
      queryBuilder.andWhere('relationship.status IN (:...activeStatuses)', {
        activeStatuses: [RelationshipStatus.PENDING, RelationshipStatus.ACTIVE, RelationshipStatus.PAUSED]
      });
    }

    if (queryDto.relationshipType) {
      queryBuilder.andWhere('relationship.relationshipType = :relationshipType', { 
        relationshipType: queryDto.relationshipType 
      });
    }

    if (queryDto.dataAccessLevel) {
      queryBuilder.andWhere('relationship.dataAccessLevel = :dataAccessLevel', { 
        dataAccessLevel: queryDto.dataAccessLevel 
      });
    }

    if (queryDto.focusAreas && queryDto.focusAreas.length > 0) {
      queryBuilder.andWhere('relationship.focusAreas && :focusAreas', { 
        focusAreas: queryDto.focusAreas 
      });
    }

    queryBuilder.orderBy('relationship.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Get all active coaches for a client
   */
  async getClientCoaches(clientId: string): Promise<ClientCoachRelationship[]> {
    return this.findRelationships({
      clientId,
      status: RelationshipStatus.ACTIVE
    });
  }

  /**
   * Get all active clients for a coach
   */
  async getCoachClients(coachId: string): Promise<ClientCoachRelationship[]> {
    return this.findRelationships({
      coachId,
      status: RelationshipStatus.ACTIVE
    });
  }

  /**
   * Check if a coach has access to a client's data
   */
  async hasDataAccess(coachId: string, clientId: string): Promise<boolean> {
    const relationship = await this.relationshipRepository.findOne({
      where: {
        coachId,
        clientId,
        status: RelationshipStatus.ACTIVE
      }
    });

    return relationship?.canAccessData() || false;
  }

  /**
   * Check if a coach has a specific permission for a client
   */
  async hasPermission(
    coachId: string, 
    clientId: string, 
    permissionType: PermissionType
  ): Promise<boolean> {
    const relationship = await this.relationshipRepository.findOne({
      where: { coachId, clientId, status: RelationshipStatus.ACTIVE },
      relations: ['permissions']
    });

    if (!relationship) return false;

    const permission = relationship.permissions?.find(p => p.permissionType === permissionType);
    return permission?.canUse() || false;
  }

  /**
   * Get relationship statistics for a client
   */
  async getClientStats(clientId: string): Promise<any> {
    const relationships = await this.findRelationships({ clientId });

    const stats = {
      totalCoaches: relationships.length,
      activeCoaches: relationships.filter(r => r.status === RelationshipStatus.ACTIVE).length,
      pendingInvitations: relationships.filter(r => r.status === RelationshipStatus.PENDING).length,
      completedRelationships: relationships.filter(r => r.status === RelationshipStatus.COMPLETED).length,
      primaryCoach: relationships.find(r => r.relationshipType === RelationshipType.PRIMARY),
      averageRelationshipDuration: 0,
      focusAreas: [] as string[],
      specializations: [] as string[]
    };

    // Calculate average duration for completed relationships
    const completedWithDuration = relationships.filter(r => 
      r.status === RelationshipStatus.COMPLETED && r.relationshipStarted && r.relationshipEnded
    );

    if (completedWithDuration.length > 0) {
      const totalDuration = completedWithDuration.reduce((sum, r) => sum + r.getDurationInDays(), 0);
      stats.averageRelationshipDuration = Math.round(totalDuration / completedWithDuration.length);
    }

    // Collect focus areas and specializations
    relationships.forEach(r => {
      if (r.focusAreas) {
        stats.focusAreas.push(...r.focusAreas);
      }
      if (r.specialization) {
        stats.specializations.push(r.specialization);
      }
    });

    // Remove duplicates
    stats.focusAreas = [...new Set(stats.focusAreas)];
    stats.specializations = [...new Set(stats.specializations)];

    return stats;
  }

  /**
   * Get relationship statistics for a coach
   */
  async getCoachStats(coachId: string): Promise<any> {
    const relationships = await this.findRelationships({ coachId });

    return {
      totalClients: relationships.length,
      activeClients: relationships.filter(r => r.status === RelationshipStatus.ACTIVE).length,
      pendingInvitations: relationships.filter(r => r.status === RelationshipStatus.PENDING).length,
      completedRelationships: relationships.filter(r => r.status === RelationshipStatus.COMPLETED).length,
      primaryClientRelationships: relationships.filter(r => r.relationshipType === RelationshipType.PRIMARY).length,
      averageRelationshipDuration: this.calculateAverageRelationshipDuration(relationships),
      clientRetentionRate: this.calculateClientRetentionRate(relationships),
      mostCommonFocusAreas: this.getMostCommonFocusAreas(relationships)
    };
  }

  /**
   * Create default permissions for a new relationship
   */
  private async createDefaultPermissions(relationship: ClientCoachRelationship): Promise<void> {
    const defaultPermissions: Array<{ type: PermissionType; scope: PermissionScope }> = [];

    // Set permissions based on data access level
    switch (relationship.dataAccessLevel) {
      case DataAccessLevel.FULL:
        defaultPermissions.push(
          { type: PermissionType.VIEW_PROFILE, scope: PermissionScope.FULL },
          { type: PermissionType.VIEW_GOALS, scope: PermissionScope.FULL },
          { type: PermissionType.VIEW_PROGRESS, scope: PermissionScope.FULL },
          { type: PermissionType.VIEW_SESSION_HISTORY, scope: PermissionScope.FULL },
          { type: PermissionType.VIEW_ACHIEVEMENTS, scope: PermissionScope.FULL },
          { type: PermissionType.CREATE_GOALS, scope: PermissionScope.FULL },
          { type: PermissionType.MODIFY_GOALS, scope: PermissionScope.FULL },
          { type: PermissionType.CREATE_SESSION_NOTES, scope: PermissionScope.FULL },
          { type: PermissionType.SEND_MESSAGES, scope: PermissionScope.FULL },
          { type: PermissionType.SCHEDULE_SESSIONS, scope: PermissionScope.FULL }
        );
        break;

      case DataAccessLevel.LIMITED:
        defaultPermissions.push(
          { type: PermissionType.VIEW_PROFILE, scope: PermissionScope.LIMITED },
          { type: PermissionType.VIEW_GOALS, scope: PermissionScope.LIMITED },
          { type: PermissionType.VIEW_PROGRESS, scope: PermissionScope.LIMITED },
          { type: PermissionType.CREATE_SESSION_NOTES, scope: PermissionScope.LIMITED },
          { type: PermissionType.SEND_MESSAGES, scope: PermissionScope.LIMITED },
          { type: PermissionType.SCHEDULE_SESSIONS, scope: PermissionScope.LIMITED }
        );
        break;

      case DataAccessLevel.VIEW_ONLY:
        defaultPermissions.push(
          { type: PermissionType.VIEW_PROFILE, scope: PermissionScope.READ_ONLY },
          { type: PermissionType.VIEW_GOALS, scope: PermissionScope.READ_ONLY },
          { type: PermissionType.VIEW_PROGRESS, scope: PermissionScope.READ_ONLY }
        );
        break;
    }

    // Create permission entities
    const permissions = defaultPermissions.map(perm => 
      this.permissionRepository.create({
        relationshipId: relationship.id,
        permissionType: perm.type,
        scope: perm.scope,
        granted: true,
        grantedBy: relationship.invitedBy,
        grantedDate: new Date()
      })
    );

    await this.permissionRepository.save(permissions);
  }

  /**
   * Handle relationship status changes
   */
  private async handleStatusChange(
    relationship: ClientCoachRelationship, 
    newStatus: RelationshipStatus
  ): Promise<void> {
    switch (newStatus) {
      case RelationshipStatus.ACTIVE:
        if (!relationship.relationshipStarted) {
          relationship.relationshipStarted = new Date();
        }
        break;

      case RelationshipStatus.COMPLETED:
        relationship.relationshipEnded = new Date();
        break;

      case RelationshipStatus.TERMINATED:
        relationship.relationshipEnded = new Date();
        break;
    }
  }

  private calculateAverageRelationshipDuration(relationships: ClientCoachRelationship[]): number {
    const completedRelationships = relationships.filter(r => 
      r.status === RelationshipStatus.COMPLETED && r.relationshipStarted && r.relationshipEnded
    );

    if (completedRelationships.length === 0) return 0;

    const totalDuration = completedRelationships.reduce((sum, r) => sum + r.getDurationInDays(), 0);
    return Math.round(totalDuration / completedRelationships.length);
  }

  private calculateClientRetentionRate(relationships: ClientCoachRelationship[]): number {
    const totalRelationships = relationships.length;
    if (totalRelationships === 0) return 0;

    const activeOrCompleted = relationships.filter(r => 
      r.status === RelationshipStatus.ACTIVE || r.status === RelationshipStatus.COMPLETED
    ).length;

    return Math.round((activeOrCompleted / totalRelationships) * 100);
  }

  private getMostCommonFocusAreas(relationships: ClientCoachRelationship[]): string[] {
    const focusAreaCounts: Record<string, number> = {};

    relationships.forEach(r => {
      if (r.focusAreas) {
        r.focusAreas.forEach(area => {
          focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
        });
      }
    });

    return Object.entries(focusAreaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([area]) => area);
  }
}