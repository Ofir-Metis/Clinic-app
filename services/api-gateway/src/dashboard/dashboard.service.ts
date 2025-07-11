import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  constructor(private readonly http: HttpService) {}

  async appointments() {
    const response = await firstValueFrom(this.http.get<any>(`${process.env.APPOINTMENTS_URL}/appointments/upcoming`, {
      params: { limit: 5 },
    }));
    const data = response.data;
    return data;
  }

  async notes() {
    const response = await firstValueFrom(this.http.get<any>(`${process.env.NOTES_URL}/notes/recent`, { params: { limit: 3 } }));
    const data = response.data;
    return data;
  }

  async stats() {
    const response = await firstValueFrom(this.http.get<any>(`${process.env.ANALYTICS_URL}/stats/overview`));
    const data = response.data;
    return data;
  }
}
