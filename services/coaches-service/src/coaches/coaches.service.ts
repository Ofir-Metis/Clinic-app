import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { CoachProfile, CoachSpecialization } from './coach-profile.entity';
import { UpdateCoachProfileDto } from './dto/update-coach-profile.dto';
import { validate } from 'class-validator';

/**
 * Enterprise-grade service providing coach profile operations
 * with validation, error handling, and audit logging
 */
@Injectable()
export class CoachesService {
  private readonly logger = new Logger(CoachesService.name);

  constructor(
    @InjectRepository(CoachProfile)
    private readonly profileRepository: Repository<CoachProfile>,
  ) {}

  /**
   * Get coach profile by user ID
   */
  async getProfile(userId: string): Promise<CoachProfile> {
    this.logger.log(`Fetching profile for user: ${userId}`);
    
    const profile = await this.profileRepository.findOne({ 
      where: { userId, isActive: true } 
    });
    
    if (!profile) {
      throw new NotFoundException(`Coach profile not found for user: ${userId}`);
    }
    
    return profile;
  }

  /**
   * Get public coach profile (safe for external access)
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
   * Search coaches by specialization, language, text search, etc.
   */
  async searchCoaches(criteria: {
    search?: string;
    specializations?: CoachSpecialization[];
    languages?: string[];
    acceptingNewClients?: boolean;
    sortBy?: 'rating' | 'experience' | 'name' | 'updated';
    page?: number;
    limit?: number;
  }): Promise<{ profiles: any[]; total: number; page: number; limit: number }> {
    this.logger.log('Searching coaches with criteria:', criteria);

    const page = criteria.page || 1;
    const limit = Math.min(criteria.limit || 20, 100);
    const offset = (page - 1) * limit;

    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.isActive = :isActive', { isActive: true })
      .andWhere('profile.isPublic = :isPublic', { isPublic: true });

    // Text search on name and bio
    if (criteria.search) {
      const escapedSearch = criteria.search.replace(/[%_\\]/g, '\\$&');
      queryBuilder.andWhere(
        '(profile.name ILIKE :search OR profile.bio ILIKE :search)',
        { search: `%${escapedSearch}%` }
      );
    }

    // Filter by specializations (array overlap)
    if (criteria.specializations?.length) {
      queryBuilder.andWhere('profile.specializations && :specializations', {
        specializations: criteria.specializations
      });
    }

    // Filter by languages (array overlap)
    if (criteria.languages?.length) {
      queryBuilder.andWhere('profile.languages && :languages', {
        languages: criteria.languages
      });
    }

    // Filter by accepting new clients
    if (criteria.acceptingNewClients !== undefined) {
      queryBuilder.andWhere('profile.acceptingNewClients = :accepting', {
        accepting: criteria.acceptingNewClients
      });
    }

    // Apply sorting
    switch (criteria.sortBy) {
      case 'experience':
        queryBuilder.orderBy('profile.yearsOfExperience', 'DESC', 'NULLS LAST');
        break;
      case 'name':
        queryBuilder.orderBy('profile.name', 'ASC');
        break;
      case 'rating':
        // Rating would require join to reviews/testimonials table - placeholder for now
        queryBuilder.orderBy('profile.updatedAt', 'DESC');
        break;
      case 'updated':
      default:
        queryBuilder.orderBy('profile.updatedAt', 'DESC');
        break;
    }

    // Apply pagination
    queryBuilder.limit(limit).offset(offset);

    const [profiles, total] = await queryBuilder.getManyAndCount();

    return {
      profiles: profiles.map(p => p.toPublicProfile()),
      total,
      page,
      limit
    };
  }

  /**
   * Update coach profile with enterprise validation
   */
  async updateProfile(userId: string, dto: UpdateCoachProfileDto): Promise<CoachProfile> {
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
   * Deactivate coach profile (soft delete)
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
   * Get all active coach profiles (admin use)
   */
  async getAllProfiles(options: FindManyOptions<CoachProfile> = {}): Promise<CoachProfile[]> {
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
