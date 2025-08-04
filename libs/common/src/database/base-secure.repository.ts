import { Repository, EntityManager, FindOneOptions, FindManyOptions, DeepPartial } from 'typeorm';
import { SafeQueryService } from './safe-query.service';
import { Logger } from '@nestjs/common';

export interface SecureRepositoryOptions {
  maxResults?: number;
  enableAuditLog?: boolean;
  allowedFields?: string[];
}

/**
 * Base secure repository with built-in SQL injection protection
 */
export abstract class BaseSecureRepository<T> {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly options: SecureRepositoryOptions;

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly safeQueryService: SafeQueryService,
    options: SecureRepositoryOptions = {}
  ) {
    this.options = {
      maxResults: 1000,
      enableAuditLog: true,
      allowedFields: [],
      ...options
    };
  }

  /**
   * Secure find with automatic parameter validation
   */
  async findSecure(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      // Validate and limit results
      const safeOptions = this.validateFindOptions(options);
      
      if (this.options.enableAuditLog) {
        this.logger.debug(`Find operation: ${JSON.stringify(safeOptions)}`);
      }
      
      return await this.repository.find(safeOptions);
    } catch (error) {
      this.logger.error(`Secure find failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure findOne with parameter validation
   */
  async findOneSecure(options?: FindOneOptions<T>): Promise<T | null> {
    try {
      const safeOptions = this.validateFindOneOptions(options);
      
      if (this.options.enableAuditLog) {
        this.logger.debug(`FindOne operation: ${JSON.stringify(safeOptions)}`);
      }
      
      return await this.repository.findOne(safeOptions);
    } catch (error) {
      this.logger.error(`Secure findOne failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure find by ID with validation
   */
  async findByIdSecure(id: string | number): Promise<T | null> {
    if (!this.isValidId(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      if (this.options.enableAuditLog) {
        this.logger.debug(`FindById operation: ${id}`);
      }
      
      return await this.repository.findOne({ 
        where: { id } as any 
      });
    } catch (error) {
      this.logger.error(`Secure findById failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure search with text sanitization
   */
  async searchSecure(searchTerm: string, fields: string[] = []): Promise<T[]> {
    if (!searchTerm?.trim()) {
      return [];
    }

    // Validate search term
    const cleanSearchTerm = this.sanitizeSearchTerm(searchTerm);
    const validFields = this.validateSearchFields(fields);

    try {
      const queryBuilder = this.safeQueryService.createSafeQueryBuilder(
        this.repository,
        'entity'
      );

      // Build search conditions for specified fields
      if (validFields.length > 0) {
        validFields.forEach((field, index) => {
          const condition = `entity.${field} ILIKE :searchTerm${index}`;
          const parameters = { [`searchTerm${index}`]: `%${cleanSearchTerm}%` };
          
          if (index === 0) {
            queryBuilder.where(condition, parameters);
          } else {
            queryBuilder.orWhere(condition, parameters);
          }
        });
      }

      queryBuilder.limit(this.options.maxResults || 100);

      if (this.options.enableAuditLog) {
        this.logger.debug(`Search operation: "${cleanSearchTerm}" in fields: ${validFields.join(', ')}`);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(`Secure search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure create with input validation
   */
  async createSecure(entityData: DeepPartial<T>): Promise<T> {
    try {
      // Validate input data
      this.validateEntityData(entityData);
      
      const entity = this.repository.create(entityData);
      
      if (this.options.enableAuditLog) {
        this.logger.debug(`Create operation: ${this.constructor.name}`);
      }
      
      return await this.repository.save(entity);
    } catch (error) {
      this.logger.error(`Secure create failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure update with validation
   */
  async updateSecure(id: string | number, updateData: DeepPartial<T>): Promise<T> {
    if (!this.isValidId(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      // Check if entity exists
      const existingEntity = await this.findByIdSecure(id);
      if (!existingEntity) {
        throw new Error('Entity not found');
      }

      // Validate update data
      this.validateEntityData(updateData);

      // Merge and save
      const updatedEntity = this.repository.merge(existingEntity, updateData);
      
      if (this.options.enableAuditLog) {
        this.logger.debug(`Update operation: ${this.constructor.name} ID: ${id}`);
      }
      
      return await this.repository.save(updatedEntity);
    } catch (error) {
      this.logger.error(`Secure update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Secure delete with validation
   */
  async deleteSecure(id: string | number): Promise<boolean> {
    if (!this.isValidId(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      const result = await this.repository.delete(id);
      
      if (this.options.enableAuditLog) {
        this.logger.debug(`Delete operation: ${this.constructor.name} ID: ${id}`);
      }
      
      return (result.affected || 0) > 0;
    } catch (error) {
      this.logger.error(`Secure delete failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate find options
   */
  private validateFindOptions(options?: FindManyOptions<T>): FindManyOptions<T> {
    if (!options) {
      return { take: this.options.maxResults };
    }

    // Limit results to prevent large queries
    const safeOptions = { ...options };
    if (!safeOptions.take || safeOptions.take > this.options.maxResults!) {
      safeOptions.take = this.options.maxResults;
    }

    // Validate skip parameter
    if (safeOptions.skip && safeOptions.skip > 1000000) {
      throw new Error('Skip parameter too large (max 1,000,000)');
    }

    return safeOptions;
  }

  /**
   * Validate findOne options
   */
  private validateFindOneOptions(options?: FindOneOptions<T>): FindOneOptions<T> {
    if (!options) {
      return {};
    }

    // Return as-is for findOne since it only returns one result
    return options;
  }

  /**
   * Validate ID format
   */
  private isValidId(id: string | number): boolean {
    if (typeof id === 'number') {
      return id > 0 && id <= Number.MAX_SAFE_INTEGER;
    }
    
    if (typeof id === 'string') {
      // Check for UUID format
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return true;
      }
      
      // Check for numeric string
      if (/^\d+$/.test(id)) {
        const numId = parseInt(id);
        return numId > 0 && numId <= Number.MAX_SAFE_INTEGER;
      }
    }
    
    return false;
  }

  /**
   * Sanitize search term
   */
  private sanitizeSearchTerm(searchTerm: string): string {
    return searchTerm
      .trim()
      .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE wildcards
      .substring(0, 200); // Limit length
  }

  /**
   * Validate search fields
   */
  private validateSearchFields(fields: string[]): string[] {
    const allowedFields = this.options.allowedFields;
    
    return fields.filter(field => {
      // Basic field name validation
      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(field)) {
        this.logger.warn(`Invalid field name rejected: ${field}`);
        return false;
      }
      
      // Check against allowed fields if specified
      if (allowedFields && allowedFields.length > 0) {
        return allowedFields.includes(field);
      }
      
      return true;
    });
  }

  /**
   * Validate entity data - override in concrete implementations
   */
  protected validateEntityData(data: DeepPartial<T>): void {
    // Basic validation - override in concrete repositories
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid entity data');
    }
  }
}