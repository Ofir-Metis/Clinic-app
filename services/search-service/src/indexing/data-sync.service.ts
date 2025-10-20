import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { StructuredLoggerService } from '@clinic/common';

@Injectable()
export class DataSyncService implements OnModuleInit {
  constructor(
    private readonly elasticsearch: ElasticsearchService,
    private readonly logger: StructuredLoggerService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('Data sync service initialized - search-service/data-sync', 'DataSyncService');
  }

  /**
   * Sync all data from database to Elasticsearch
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllData(): Promise<void> {
    this.logger.log('Starting full data sync', 'DataSyncService');

    try {
      await Promise.all([
        this.syncClients(),
        this.syncAppointments(),
        this.syncSessionNotes(),
        this.syncFiles(),
        this.syncCoaches(),
      ]);

      this.logger.log('Full data sync completed successfully', 'DataSyncService');
    } catch (error) {
      this.logger.error(`Full data sync failed: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync incremental changes
   * Runs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async syncIncrementalChanges(): Promise<void> {
    const since = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    
    this.logger.log(`Starting incremental data sync since ${since.toISOString()}`, 'DataSyncService');

    try {
      await Promise.all([
        this.syncClientsIncremental(since),
        this.syncAppointmentsIncremental(since),
        this.syncSessionNotesIncremental(since),
        this.syncFilesIncremental(since),
        this.syncCoachesIncremental(since),
      ]);

      this.logger.log('Incremental data sync completed', 'DataSyncService');
    } catch (error) {
      this.logger.error(`Incremental data sync failed: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync all clients
   */
  private async syncClients(): Promise<void> {
    try {
      const clients = await this.dataSource.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", 
               email, phone, date_of_birth as "dateOfBirth", 
               notes, created_at as "createdAt", updated_at as "updatedAt",
               is_active as "isActive"
        FROM users 
        WHERE role = 'client' AND deleted_at IS NULL
      `);

      const documents = clients.map(client => ({
        id: client.id,
        body: {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth,
          notes: client.notes || '',
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          isActive: client.isActive !== false,
        },
      }));

      if (documents.length > 0) {
        await this.elasticsearch.bulkIndex('clients', documents);
      }

      this.logger.log(`Synced ${documents.length} clients`, 'DataSyncService');
    } catch (error) {
      this.logger.error(`Failed to sync clients: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync clients incrementally
   */
  private async syncClientsIncremental(since: Date): Promise<void> {
    try {
      const clients = await this.dataSource.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", 
               email, phone, date_of_birth as "dateOfBirth", 
               notes, created_at as "createdAt", updated_at as "updatedAt",
               is_active as "isActive"
        FROM users 
        WHERE role = 'client' 
        AND (updated_at > $1 OR created_at > $1)
        AND deleted_at IS NULL
      `, [since]);

      if (clients.length > 0) {
        const documents = clients.map(client => ({
          id: client.id,
          body: {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            dateOfBirth: client.dateOfBirth,
            notes: client.notes || '',
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            isActive: client.isActive !== false,
          },
        }));

        await this.elasticsearch.bulkIndex('clients', documents);
        
        this.logger.log(`Synced ${documents.length} updated clients`, 'DataSyncService');
      }
    } catch (error) {
      this.logger.error(`Failed to sync clients incrementally: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync all appointments
   */
  private async syncAppointments(): Promise<void> {
    try {
      const appointments = await this.dataSource.query(`
        SELECT id, title, description, client_id as "clientId", 
               coach_id as "coachId", start_time as "startTime", 
               end_time as "endTime", type, status,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM appointments 
        WHERE deleted_at IS NULL
      `);

      const documents = appointments.map(appointment => ({
        id: appointment.id,
        body: {
          title: appointment.title,
          description: appointment.description || '',
          clientId: appointment.clientId,
          coachId: appointment.coachId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          type: appointment.type,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
      }));

      if (documents.length > 0) {
        await this.elasticsearch.bulkIndex('appointments', documents);
      }

      this.logger.log(`Synced ${documents.length} appointments`, 'DataSyncService');
    } catch (error) {
      this.logger.error(`Failed to sync appointments: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync appointments incrementally
   */
  private async syncAppointmentsIncremental(since: Date): Promise<void> {
    try {
      const appointments = await this.dataSource.query(`
        SELECT id, title, description, client_id as "clientId", 
               coach_id as "coachId", start_time as "startTime", 
               end_time as "endTime", type, status,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM appointments 
        WHERE (updated_at > $1 OR created_at > $1)
        AND deleted_at IS NULL
      `, [since]);

      if (appointments.length > 0) {
        const documents = appointments.map(appointment => ({
          id: appointment.id,
          body: {
            title: appointment.title,
            description: appointment.description || '',
            clientId: appointment.clientId,
            coachId: appointment.coachId,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            type: appointment.type,
            status: appointment.status,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
          },
        }));

        await this.elasticsearch.bulkIndex('appointments', documents);
        
        this.logger.log(`Synced ${documents.length} updated appointments`, 'DataSyncService');
      }
    } catch (error) {
      this.logger.error(`Failed to sync appointments incrementally: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  /**
   * Sync session notes (placeholder - implement based on actual schema)
   */
  private async syncSessionNotes(): Promise<void> {
    // Implementation depends on actual session notes table structure
    this.logger.log('Session notes sync placeholder', 'DataSyncService');
  }

  private async syncSessionNotesIncremental(since: Date): Promise<void> {
    // Implementation depends on actual session notes table structure
    this.logger.log('Session notes incremental sync placeholder', 'DataSyncService');
  }

  /**
   * Sync files (placeholder - implement based on actual schema)
   */
  private async syncFiles(): Promise<void> {
    // Implementation depends on actual files table structure
    this.logger.log('Files sync placeholder', 'DataSyncService');
  }

  private async syncFilesIncremental(since: Date): Promise<void> {
    // Implementation depends on actual files table structure
    this.logger.log('Files incremental sync placeholder', 'DataSyncService');
  }

  /**
   * Sync coaches
   */
  private async syncCoaches(): Promise<void> {
    try {
      const coaches = await this.dataSource.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", 
               email, phone, bio, certifications,
               created_at as "createdAt", updated_at as "updatedAt",
               is_active as "isActive"
        FROM users 
        WHERE role IN ('coach', 'therapist') AND deleted_at IS NULL
      `);

      const documents = coaches.map(coach => ({
        id: coach.id,
        body: {
          firstName: coach.firstName,
          lastName: coach.lastName,
          email: coach.email,
          phone: coach.phone,
          bio: coach.bio || '',
          certifications: coach.certifications || '',
          isActive: coach.isActive !== false,
          createdAt: coach.createdAt,
          updatedAt: coach.updatedAt,
        },
      }));

      if (documents.length > 0) {
        await this.elasticsearch.bulkIndex('coaches', documents);
      }

      this.logger.log(`Synced ${documents.length} coaches`, 'DataSyncService');
    } catch (error) {
      this.logger.error(`Failed to sync coaches: ${error.message}`, undefined, 'DataSyncService');
    }
  }

  private async syncCoachesIncremental(since: Date): Promise<void> {
    try {
      const coaches = await this.dataSource.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", 
               email, phone, bio, certifications,
               created_at as "createdAt", updated_at as "updatedAt",
               is_active as "isActive"
        FROM users 
        WHERE role IN ('coach', 'therapist')
        AND (updated_at > $1 OR created_at > $1)
        AND deleted_at IS NULL
      `, [since]);

      if (coaches.length > 0) {
        const documents = coaches.map(coach => ({
          id: coach.id,
          body: {
            firstName: coach.firstName,
            lastName: coach.lastName,
            email: coach.email,
            phone: coach.phone,
            bio: coach.bio || '',
            certifications: coach.certifications || '',
            isActive: coach.isActive !== false,
            createdAt: coach.createdAt,
            updatedAt: coach.updatedAt,
          },
        }));

        await this.elasticsearch.bulkIndex('coaches', documents);
        
        this.logger.log(`Synced ${documents.length} updated coaches`, 'DataSyncService');
      }
    } catch (error) {
      this.logger.error(`Failed to sync coaches incrementally: ${error.message}`, undefined, 'DataSyncService');
    }
  }
}