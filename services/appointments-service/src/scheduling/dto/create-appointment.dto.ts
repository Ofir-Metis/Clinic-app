import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * DTO validating appointment creation payload.
 */
export class CreateAppointmentDto {
  patientId!: string;

  @IsDateString()
  datetime!: string;

  @IsString()
  serviceType!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
