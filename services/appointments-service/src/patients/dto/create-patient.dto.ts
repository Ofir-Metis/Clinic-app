import { IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

/**
 * DTO for creating a patient.
 */
export class CreatePatientDto {
  firstName!: string;
  lastName!: string;
  email!: string;
  phone!: string;

  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}
