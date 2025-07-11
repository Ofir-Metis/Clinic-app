import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SettingsService {
  constructor(private readonly http: HttpService) {}

  async get(userId: number, auth: string) {
    const url = `${process.env.SETTINGS_URL}/settings`;
    const response = await firstValueFrom(this.http.get<any>(url));
    const data = response.data;
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
