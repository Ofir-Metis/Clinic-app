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
    this.logger.info('Data sync service initialized', {
      service: 'search-service',
      component: 'data-sync',
    });
  }

  /**
   * Sync all data from database to Elasticsearch
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllData(): Promise<void> {
    this.logger.info('Starting full data sync', {
      service: 'search-service',
      component: 'data-sync',
    });

    try {
      await Promise.all([
        this.syncClients(),
        this.syncAppointments(),
        this.syncSessionNotes(),
        this.syncFiles(),
        this.syncCoaches(),
      ]);

      this.logger.info('Full data sync completed successfully', {
        service: 'search-service',
        component: 'data-sync',
      });
    } catch (error) {
      this.logger.error('Full data sync failed', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
    }
  }

  /**
   * Sync incremental changes
   * Runs every 15 minutes
   */
  @Cron(CronExpression.EVERY_15_MINUTES)
  async syncIncrementalChanges(): Promise<void> {
    const since = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    
    this.logger.debug('Starting incremental data sync', {
      service: 'search-service',
      component: 'data-sync',
      since: since.toISOString(),
    });

    try {
      await Promise.all([
        this.syncClientsIncremental(since),
        this.syncAppointmentsIncremental(since),
        this.syncSessionNotesIncremental(since),
        this.syncFilesIncremental(since),
        this.syncCoachesIncremental(since),
      ]);

      this.logger.debug('Incremental data sync completed', {
        service: 'search-service',
        component: 'data-sync',
      });
    } catch (error) {
      this.logger.error('Incremental data sync failed', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
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

      this.logger.info(`Synced ${documents.length} clients`, {
        service: 'search-service',
        component: 'data-sync',
        count: documents.length,
      });
    } catch (error) {
      this.logger.error('Failed to sync clients', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
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
        
        this.logger.debug(`Synced ${documents.length} updated clients`, {
          service: 'search-service',
          component: 'data-sync',
          count: documents.length,
        });
      }
    } catch (error) {
      this.logger.error('Failed to sync clients incrementally', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
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

      this.logger.info(`Synced ${documents.length} appointments`, {
        service: 'search-service',
        component: 'data-sync',
        count: documents.length,
      });
    } catch (error) {
      this.logger.error('Failed to sync appointments', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
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
        
        this.logger.debug(`Synced ${documents.length} updated appointments`, {
          service: 'search-service',
          component: 'data-sync',
          count: documents.length,
        });
      }
    } catch (error) {
      this.logger.error('Failed to sync appointments incrementally', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
    }
  }

  /**
   * Sync session notes (placeholder - implement based on actual schema)
   */
  private async syncSessionNotes(): Promise<void> {
    // Implementation depends on actual session notes table structure
    this.logger.debug('Session notes sync placeholder', {
      service: 'search-service',
      component: 'data-sync',
    });
  }

  private async syncSessionNotesIncremental(since: Date): Promise<void> {
    // Implementation depends on actual session notes table structure
    this.logger.debug('Session notes incremental sync placeholder', {
      service: 'search-service',
      component: 'data-sync',
    });
  }

  /**
   * Sync files (placeholder - implement based on actual schema)
   */
  private async syncFiles(): Promise<void> {
    // Implementation depends on actual files table structure
    this.logger.debug('Files sync placeholder', {
      service: 'search-service',
      component: 'data-sync',
    });
  }

  private async syncFilesIncremental(since: Date): Promise<void> {
    // Implementation depends on actual files table structure
    this.logger.debug('Files incremental sync placeholder', {
      service: 'search-service',
      component: 'data-sync',
    });
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

      this.logger.info(`Synced ${documents.length} coaches`, {
        service: 'search-service',
        component: 'data-sync',
        count: documents.length,
      });
    } catch (error) {
      this.logger.error('Failed to sync coaches', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
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
        
        this.logger.debug(`Synced ${documents.length} updated coaches`, {
          service: 'search-service',
          component: 'data-sync',
          count: documents.length,
        });
      }
    } catch (error) {
      this.logger.error('Failed to sync coaches incrementally', {
        service: 'search-service',
        component: 'data-sync',
        error: error.message,
      });
    }
  }
}