import { Injectable, HttpService } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SettingsService {
  constructor(private readonly http: HttpService) {}

  async get(userId: number, auth: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.SETTINGS_URL}/settings`, {
        headers: { Authorization: auth },
      }),
    );
    return data;
  }

  async update(userId: number, dto: any[], auth: string) {
    const { data } = await firstValueFrom(
      this.http.put(`${process.env.SETTINGS_URL}/settings`, dto, {
        headers: { Authorization: auth },
      }),
    );
    return data;
  }
}
