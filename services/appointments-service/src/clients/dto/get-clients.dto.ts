import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetPatientsDto {
  @IsString()
  @IsOptional()
  coachId?: string;

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
