import { IsOptional, IsBoolean} from 'class-validator';

/**
 * DTO for creating a client.
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
