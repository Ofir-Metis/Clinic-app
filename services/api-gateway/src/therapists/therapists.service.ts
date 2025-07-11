import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TherapistsService {
  constructor(private readonly http: HttpService) {}

  async getProfile(id: number) {
    const url = `${process.env.THERAPISTS_URL}/therapists/${id}/profile`;
    const response = await firstValueFrom(this.http.get<any>(url));
    const data = response.data;
    return data;
  }

  async updateProfile(id: number, dto: any, auth: string) {
    const { data } = await firstValueFrom(
      this.http.put(`${process.env.THERAPISTS_URL}/therapists/${id}/profile`, dto, {
        headers: { Authorization: auth },
      }),
    );
    return data;
  }
}
