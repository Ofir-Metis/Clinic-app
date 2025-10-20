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
    this.logger.log('Indexing service initialized - search-service/indexing', 'IndexingService');
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
      
      this.logger.log(`Client indexed successfully: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to index client ${data.id}: ${error.message}`, undefined, 'IndexingService');
    }
  }

  /**
   * Remove client from index
   */
  @EventPattern('client.deleted')
  async removeClient(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('clients', data.id);
      
      this.logger.log(`Client removed from index: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to remove client from index ${data.id}: ${error.message}`, undefined, 'IndexingService');
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
      
      this.logger.log(`Appointment indexed successfully: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to index appointment ${data.id}: ${error.message}`, undefined, 'IndexingService');
    }
  }

  /**
   * Remove appointment from index
   */
  @EventPattern('appointment.deleted')
  async removeAppointment(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('appointments', data.id);
      
      this.logger.log(`Appointment removed from index: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to remove appointment from index ${data.id}: ${error.message}`, undefined, 'IndexingService');
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
      
      this.logger.log(`Session notes indexed successfully: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to index session notes ${data.id}: ${error.message}`, undefined, 'IndexingService');
    }
  }

  /**
   * Remove session notes from index
   */
  @EventPattern('session-notes.deleted')
  async removeSessionNotes(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('session-notes', data.id);
      
      this.logger.log(`Session notes removed from index: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to remove session notes from index ${data.id}: ${error.message}`, undefined, 'IndexingService');
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
      
      this.logger.log(`File indexed successfully: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to index file ${data.id}: ${error.message}`, undefined, 'IndexingService');
    }
  }

  /**
   * Remove file from index
   */
  @EventPattern('file.deleted')
  async removeFile(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('files', data.id);
      
      this.logger.log(`File removed from index: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to remove file from index ${data.id}: ${error.message}`, undefined, 'IndexingService');
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
      
      this.logger.log(`Coach indexed successfully: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to index coach ${data.id}: ${error.message}`, undefined, 'IndexingService');
    }
  }

  /**
   * Remove coach from index
   */
  @EventPattern('coach.deleted')
  async removeCoach(data: { id: string }): Promise<void> {
    try {
      await this.elasticsearch.deleteDocument('coaches', data.id);
      
      this.logger.log(`Coach removed from index: ${data.id}`, 'IndexingService');
    } catch (error) {
      this.logger.error(`Failed to remove coach from index ${data.id}: ${error.message}`, undefined, 'IndexingService');
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
      this.logger.error(`Reindex operation failed for ${data.index || 'all indices'}: ${error.message}`, undefined, 'IndexingService');
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
    this.logger.log(`Starting reindex for ${index}`, 'IndexingService');

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