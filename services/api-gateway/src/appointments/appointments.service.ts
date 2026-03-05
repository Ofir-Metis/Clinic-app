import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Pool } from 'pg';

export interface CreateAppointmentDto {
  therapistId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  type?: string;
  status?: string;
  notes?: string;
  title?: string;
}

export interface Appointment {
  id: string;
  therapistId: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  notes?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database pool for direct queries
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'clinic',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    try {
      const now = new Date();
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);
      const title = dto.title || `Session - ${startTime.toLocaleDateString()}`;

      const result = await pool.query(
        `INSERT INTO appointments (therapist_id, client_id, start_time, end_time, title, status, meeting_type, created_by, "patientId", datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $2, $3)
         RETURNING *`,
        [dto.therapistId, dto.clientId, startTime, endTime, title, dto.status || 'scheduled', dto.type || 'virtual', dto.therapistId]
      );

      this.logger.log(`Appointment created: ${result.rows[0].id}`);
      return this.mapRow(result.rows[0]);
    } catch (error: any) {
      this.logger.error(`Failed to create appointment: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to create appointment',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAll(coachId?: string, clientId?: string): Promise<{ items: Appointment[]; total: number }> {
    try {
      let query = 'SELECT * FROM appointments WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (coachId) {
        query += ` AND therapist_id = $${paramIndex}`;
        params.push(coachId);
        paramIndex++;
      }

      if (clientId) {
        query += ` AND client_id = $${paramIndex}`;
        params.push(clientId);
        paramIndex++;
      }

      query += ' ORDER BY start_time DESC';

      const result = await pool.query(query, params);
      const items = result.rows.map(row => this.mapRow(row));

      return { items, total: items.length };
    } catch (error: any) {
      this.logger.error(`Failed to fetch appointments: ${error.message}`, error.stack);
      return { items: [], total: 0 };
    }
  }

  async findOne(id: number | string): Promise<Appointment> {
    const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id.toString()]);
    if (result.rows.length === 0) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }
    return this.mapRow(result.rows[0]);
  }

  async update(id: number | string, dto: Partial<CreateAppointmentDto>): Promise<Appointment> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.startTime) {
      updates.push(`start_time = $${paramIndex++}`);
      params.push(new Date(dto.startTime));
    }
    if (dto.endTime) {
      updates.push(`end_time = $${paramIndex++}`);
      params.push(new Date(dto.endTime));
    }
    if (dto.title) {
      updates.push(`title = $${paramIndex++}`);
      params.push(dto.title);
    }
    if (dto.status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(dto.status);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(dto.notes);
    }

    if (updates.length === 0) {
      return this.findOne(id);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id.toString());

    const result = await pool.query(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    return this.mapRow(result.rows[0]);
  }

  async delete(id: number | string): Promise<void> {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1', [id.toString()]);
    if (result.rowCount === 0) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }
    this.logger.log(`Appointment deleted: ${id}`);
  }

  private mapRow(row: any): Appointment {
    return {
      id: row.id,
      therapistId: row.therapist_id,
      clientId: row.client_id,
      startTime: row.start_time,
      endTime: row.end_time,
      type: row.meeting_type || 'virtual',
      status: row.status,
      notes: row.notes,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
