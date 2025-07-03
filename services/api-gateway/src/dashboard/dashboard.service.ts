import { Injectable, HttpService } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  constructor(private readonly http: HttpService) {}

  async appointments() {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.APPOINTMENTS_URL}/appointments/upcoming`, {
        params: { limit: 5 },
      }),
    );
    return data;
  }

  async notes() {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.NOTES_URL}/notes/recent`, { params: { limit: 3 } }),
    );
    return data;
  }

  async stats() {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.ANALYTICS_URL}/stats/overview`),
    );
    return data;
  }
}
