import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetPatientsDto {
  @IsInt()
  therapistId: number;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
