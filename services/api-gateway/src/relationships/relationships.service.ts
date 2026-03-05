import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RelationshipsService {
  private readonly relationshipsServiceUrl =
    process.env.CLIENT_RELATIONSHIPS_URL || 'http://localhost:3014';

  constructor(private readonly http: HttpService) {}

  async createRelationship(dto: any, auth: string) {
    const url = `${this.relationshipsServiceUrl}/relationships`;
    const response = await firstValueFrom(
      this.http.post(url, dto, {
        headers: { Authorization: auth }
      })
    );
    return response.data;
  }

  async getClientRelationships(clientId: string, status?: string, auth?: string) {
    const url = `${this.relationshipsServiceUrl}/relationships/client/${clientId}`;
    const params = status ? { status } : {};
    const headers = auth ? { Authorization: auth } : {};

    const response = await firstValueFrom(
      this.http.get(url, { params, headers })
    );
    return response.data;
  }

  async getCoachRelationships(coachId: string, status?: string, auth?: string) {
    const url = `${this.relationshipsServiceUrl}/relationships/coach/${coachId}`;
    const params = status ? { status } : {};
    const headers = auth ? { Authorization: auth } : {};

    const response = await firstValueFrom(
      this.http.get(url, { params, headers })
    );
    return response.data;
  }

  async updateRelationshipStatus(id: string, body: any, auth: string) {
    const url = `${this.relationshipsServiceUrl}/relationships/${id}/status`;
    const response = await firstValueFrom(
      this.http.put(url, body, {
        headers: { Authorization: auth }
      })
    );
    return response.data;
  }

  async getRelationship(id: string, auth?: string) {
    const url = `${this.relationshipsServiceUrl}/relationships/${id}`;
    const headers = auth ? { Authorization: auth } : {};

    const response = await firstValueFrom(
      this.http.get(url, { headers })
    );
    return response.data;
  }
}
