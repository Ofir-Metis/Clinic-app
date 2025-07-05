import { Injectable, HttpService } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TherapistsService {
  constructor(private readonly http: HttpService) {}

  async getProfile(id: number) {
    const { data } = await firstValueFrom(
      this.http.get(`${process.env.THERAPISTS_URL}/therapists/${id}/profile`),
    );
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
