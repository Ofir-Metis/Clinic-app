import { IsInt, IsOptional, IsISO8601 } from 'class-validator';

export class GetPatientAppointmentsDto {
  patientId!: number;

  @IsOptional()
  @IsInt()
  therapistId?: number;

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
