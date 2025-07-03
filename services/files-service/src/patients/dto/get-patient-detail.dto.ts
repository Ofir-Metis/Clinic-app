import { IsInt } from 'class-validator';

export class GetPatientDetailDto {
  @IsInt()
  id: number;
}
