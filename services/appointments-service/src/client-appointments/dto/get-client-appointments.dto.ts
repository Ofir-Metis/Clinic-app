import { IsInt, IsOptional, IsISO8601, IsString } from 'class-validator';

export class GetClientAppointmentsDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  therapistId?: string;

  @IsOptional()
  @IsISO8601()
  start?: string;

  @IsOptional()
  @IsISO8601()
  end?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
