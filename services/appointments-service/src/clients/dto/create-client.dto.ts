import { IsOptional, IsBoolean, IsString, IsEmail, MaxLength, Matches } from 'class-validator';

/**
 * DTO for creating a client.
 */
export class CreatePatientDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^[+]?[\d\s()-]+$/, { message: 'Phone must contain only digits, spaces, parentheses, hyphens, and optional leading +' })
  phone!: string;

  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}
