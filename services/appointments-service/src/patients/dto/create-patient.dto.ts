import { IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

/**
 * DTO for creating a patient.
 */
export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}
