import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { StructuredLoggerService } from '@clinic/common';

@Injectable()
export class IndexingService implements OnModuleInit {
  constructor(
    private readonly elasticsearch: ElasticsearchService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async onModuleInit() {
    this.logger.info('Indexing service initialized', {
      service: 'search-service',
      component: 'indexing',
    });
  }

  /**
   * Index client data
   */
  @EventPattern('client.created')
  @EventPattern('client.updated')
  async indexClient(data: { id: string; [key: string]: any }): Promise<void> {
    try {
      const document = this.transformClientData(data);
      await this.elasticsearch.indexDocument('clients', data.id, document);
      
      this.logger.info('Client indexed successfully', {
        service: 'search-service',
        component: 'indexing',
        clientId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to index client', {
        service: 'search-service',
        component: 'indexing',
        clientId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Remove client from index
   */
  @EventPattern('client.deleted')
  async removeClient(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('clients', data.id);
      
      this.logger.info('Client removed from index', {
        service: 'search-service',
        component: 'indexing',
        clientId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove client from index', {
        service: 'search-service',
        component: 'indexing',
        clientId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Index appointment data
   */
  @EventPattern('appointment.created')
  @EventPattern('appointment.updated')
  async indexAppointment(data: { id: string; [key: string]: any }): Promise<void> {
    try {
      const document = this.transformAppointmentData(data);
      await this.elasticsearch.indexDocument('appointments', data.id, document);
      
      this.logger.info('Appointment indexed successfully', {
        service: 'search-service',
        component: 'indexing',
        appointmentId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to index appointment', {
        service: 'search-service',
        component: 'indexing',
        appointmentId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Remove appointment from index
   */
  @EventPattern('appointment.deleted')
  async removeAppointment(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('appointments', data.id);
      
      this.logger.info('Appointment removed from index', {
        service: 'search-service',
        component: 'indexing',
        appointmentId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove appointment from index', {
        service: 'search-service',
        component: 'indexing',
        appointmentId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Index session notes
   */
  @EventPattern('session-notes.created')
  @EventPattern('session-notes.updated')
  async indexSessionNotes(data: { id: string; [key: string]: any }): Promise<void> {
    try {
      const document = this.transformSessionNotesData(data);
      await this.elasticsearch.indexDocument('session-notes', data.id, document);
      
      this.logger.info('Session notes indexed successfully', {
        service: 'search-service',
        component: 'indexing',
        sessionNotesId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to index session notes', {
        service: 'search-service',
        component: 'indexing',
        sessionNotesId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Remove session notes from index
   */
  @EventPattern('session-notes.deleted')
  async removeSessionNotes(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('session-notes', data.id);
      
      this.logger.info('Session notes removed from index', {
        service: 'search-service',
        component: 'indexing',
        sessionNotesId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove session notes from index', {
        service: 'search-service',
        component: 'indexing',
        sessionNotesId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Index file data
   */
  @EventPattern('file.created')
  @EventPattern('file.updated')
  async indexFile(data: { id: string; [key: string]: any }): Promise<void> {
    try {
      const document = this.transformFileData(data);
      await this.elasticsearch.indexDocument('files', data.id, document);
      
      this.logger.info('File indexed successfully', {
        service: 'search-service',
        component: 'indexing',
        fileId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to index file', {
        service: 'search-service',
        component: 'indexing',
        fileId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Remove file from index
   */
  @EventPattern('file.deleted')
  async removeFile(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('files', data.id);
      
      this.logger.info('File removed from index', {
        service: 'search-service',
        component: 'indexing',
        fileId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove file from index', {
        service: 'search-service',
        component: 'indexing',
        fileId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Index coach data
   */
  @EventPattern('coach.created')
  @EventPattern('coach.updated')
  async indexCoach(data: { id: string; [key: string]: any }): Promise<void> {
    try {
      const document = this.transformCoachData(data);
      await this.elasticsearch.indexDocument('coaches', data.id, document);
      
      this.logger.info('Coach indexed successfully', {
        service: 'search-service',
        component: 'indexing',
        coachId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to index coach', {
        service: 'search-service',
        component: 'indexing',
        coachId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Remove coach from index
   */
  @EventPattern('coach.deleted')
  async removeCoach(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('coaches', data.id);
      
      this.logger.info('Coach removed from index', {
        service: 'search-service',
        component: 'indexing',
        coachId: data.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove coach from index', {
        service: 'search-service',
        component: 'indexing',
        coachId: data.id,
        error: error.message,
      });
    }
  }

  /**
   * Bulk reindex operation
   */
  @MessagePattern('search.reindex')
  async reindexAll(data: { index?: string }): Promise<{ success: boolean; message: string }> {
    try {
      if (data.index) {
        await this.reindexSingle(data.index);
        return { success: true, message: `Reindexed ${data.index}` };
      } else {
        await this.reindexAllIndices();
        return { success: true, message: 'Reindexed all indices' };
      }
    } catch (error) {
      this.logger.error('Reindex operation failed', {
        service: 'search-service',
        component: 'indexing',
        index: data.index,
        error: error.message,
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * Transform client data for indexing
   */
  private transformClientData(data: any): any {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      tags: data.tags || [],
      notes: data.notes || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isActive: data.isActive !== false,
    };
  }

  /**
   * Transform appointment data for indexing
   */
  private transformAppointmentData(data: any): any {
    return {
      title: data.title,
      description: data.description || '',
      clientId: data.clientId,
      coachId: data.coachId,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      status: data.status,
      tags: data.tags || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Transform session notes data for indexing
   */
  private transformSessionNotesData(data: any): any {
    return {
      title: data.title,
      content: data.content || '',
      summary: data.summary || '',
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      coachId: data.coachId,
      tags: data.tags || [],
      mood: data.mood,
      progressNotes: data.progressNotes || '',
      actionItems: data.actionItems || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Transform file data for indexing
   */
  private transformFileData(data: any): any {
    return {
      fileName: data.fileName,
      description: data.description || '',
      mimeType: data.mimeType,
      category: data.category,
      tags: data.tags || [],
      ownerId: data.ownerId,
      clientId: data.clientId,
      appointmentId: data.appointmentId,
      extractedText: data.extractedText || '',
      metadata: data.metadata || {},
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Transform coach data for indexing
   */
  private transformCoachData(data: any): any {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      bio: data.bio || '',
      specializations: data.specializations || [],
      certifications: data.certifications || '',
      languages: data.languages || [],
      location: data.location,
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Reindex a single index
   */
  private async reindexSingle(index: string): Promise<void> {
    this.logger.info(`Starting reindex for ${index}`, {
      service: 'search-service',
      component: 'indexing',
      index,
    });

    // This would typically involve:
    // 1. Fetching all data from the database
    // 2. Transforming it for Elasticsearch
    // 3. Bulk indexing
    // Implementation depends on the specific data source and requirements
  }

  /**
   * Reindex all indices
   */
  private async reindexAllIndices(): Promise<void> {
    const indices = ['clients', 'appointments', 'session-notes', 'files', 'coaches'];
    
    for (const index of indices) {
      await this.reindexSingle(index);
    }
  }
}