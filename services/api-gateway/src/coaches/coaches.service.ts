import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CoachesService {
  private readonly coachesServiceUrl = process.env.THERAPISTS_URL || 'http://localhost:3013';

  constructor(private readonly http: HttpService) {}

  async searchCoaches(query: any) {
    const url = `${this.coachesServiceUrl}/coaches`;
    const response = await firstValueFrom(
      this.http.get<any>(url, { params: query })
    );
    return response.data;
  }

  async getProfile(id: number) {
    const url = `${this.coachesServiceUrl}/coaches/${id}/profile`;
    const response = await firstValueFrom(this.http.get<any>(url));
    const data = response.data;
    return data;
  }

  async updateProfile(id: number, dto: any, auth: string) {
    const { data } = await firstValueFrom(
      this.http.put(`${this.coachesServiceUrl}/coaches/${id}/profile`, dto, {
        headers: { Authorization: auth },
      }),
    );
    return data;
  }
}
