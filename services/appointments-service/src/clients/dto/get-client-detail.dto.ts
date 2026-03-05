import { IsString } from 'class-validator';

export class GetPatientDetailDto {
  @IsString()
  id!: string;
}
