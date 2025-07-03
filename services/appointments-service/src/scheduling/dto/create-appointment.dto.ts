import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * DTO validating appointment creation payload.
 */
export class CreateAppointmentDto {
  @IsInt()
  patientId: number;

  @IsDateString()
  datetime: string;

  @IsString()
  serviceType: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
