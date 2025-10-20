import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { TherapistProfile, TherapistSpecialization } from './therapist-profile.entity';
import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto';
import { validate } from 'class-validator';

/**
 * Enterprise-grade service providing therapist profile operations
 * with validation, error handling, and audit logging
 */
@Injectable()
export class TherapistsService {
  private readonly logger = new Logger(TherapistsService.name);

  constructor(
    @InjectRepository(TherapistProfile)
    private readonly profileRepository: Repository<TherapistProfile>,
  ) {}

  /**
   * Get therapist profile by user ID
   */
  async getProfile(userId: string): Promise<TherapistProfile> {
    this.logger.log(`Fetching profile for user: ${userId}`);
    
    const profile = await this.profileRepository.findOne({ 
      where: { userId, isActive: true } 
    });
    
    if (!profile) {
      throw new NotFoundException(`Therapist profile not found for user: ${userId}`);
    }
    
    return profile;
  }

  /**
   * Get public therapist profile (safe for external access)
   */
  async getPublicProfile(profileId: string): Promise<any> {
    this.logger.log(`Fetching public profile: ${profileId}`);
    
    const profile = await this.profileRepository.findOne({ 
      where: { id: profileId, isActive: true, isPublic: true } 
    });
    
    if (!profile) {
      throw new NotFoundException(`Public profile not found: ${profileId}`);
    }
    
    return profile.toPublicProfile();
  }

  /**
   * Search therapists by specialization, location, etc.
   */
  async searchTherapists(criteria: {
    specializations?: TherapistSpecialization[];
    languages?: string[];
    acceptingNewClients?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: any[]; total: number }> {
    this.logger.log('Searching therapists with criteria:', criteria);
    
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.isActive = :isActive', { isActive: true })
      .andWhere('profile.isPublic = :isPublic', { isPublic: true });
    
    if (criteria.specializations?.length) {
      queryBuilder.andWhere('profile.specializations && :specializations', {
        specializations: criteria.specializations
      });
    }
    
    if (criteria.languages?.length) {
      queryBuilder.andWhere('profile.languages && :languages', {
        languages: criteria.languages
      });
    }
    
    if (criteria.acceptingNewClients !== undefined) {
      queryBuilder.andWhere('profile.acceptingNewClients = :accepting', {
        accepting: criteria.acceptingNewClients
      });
    }
    
    queryBuilder
      .orderBy('profile.updatedAt', 'DESC')
      .limit(criteria.limit || 20)
      .offset(criteria.offset || 0);
    
    const [profiles, total] = await queryBuilder.getManyAndCount();
    
    return {
      profiles: profiles.map(p => p.toPublicProfile()),
      total
    };
  }

  /**
   * Update therapist profile with enterprise validation
   */
  async updateProfile(userId: string, dto: UpdateTherapistProfileDto): Promise<TherapistProfile> {
    this.logger.log(`Updating profile for user: ${userId}`);
    
    // Validate DTO
    const errors = await validate(dto);
    if (errors.length > 0) {
      const validationMessages = errors.map(e => {
        const constraints = e.constraints || {};
        return Object.values(constraints).join(', ');
      }).join('; ');
      throw new BadRequestException(`Validation failed: ${validationMessages}`);
    }
    
    let profile = await this.profileRepository.findOne({ 
      where: { userId } 
    });
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = this.profileRepository.create({
        userId,
        name: dto.name || '',
        title: dto.title || '',
        bio: dto.bio || '',
        specializations: dto.specializations || [],
        isActive: true,
        isPublic: false, // Default to private until approved
        acceptingNewClients: true
      });
    } else {
      // Update existing profile
      Object.assign(profile, dto);
    }
    
    try {
      const savedProfile = await this.profileRepository.save(profile);
      this.logger.log(`Profile updated successfully for user: ${userId}`);
      return savedProfile;
    } catch (error: any) {
      this.logger.error(`Failed to update profile for user: ${userId}`, error?.stack || error);
      throw new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Deactivate therapist profile (soft delete)
   */
  async deactivateProfile(userId: string): Promise<void> {
    this.logger.log(`Deactivating profile for user: ${userId}`);
    
    const result = await this.profileRepository.update(
      { userId },
      { isActive: false, isPublic: false }
    );
    
    if (result.affected === 0) {
      throw new NotFoundException(`Profile not found for user: ${userId}`);
    }
  }

  /**
   * Get all active therapist profiles (admin use)
   */
  async getAllProfiles(options: FindManyOptions<TherapistProfile> = {}): Promise<TherapistProfile[]> {
    this.logger.log('Fetching all active profiles');
    
    return this.profileRepository.find({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
      ...options
    });
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; database: boolean }> {
    try {
      await this.profileRepository.count();
      return { status: 'ok', database: true };
    } catch (error: any) {
      this.logger.error('Health check failed', error?.stack || error);
      return { status: 'error', database: false };
    }
  }
}
