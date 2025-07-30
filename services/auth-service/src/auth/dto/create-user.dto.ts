import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

/**
 * DTO for user registration.
 */
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(['therapist', 'patient', 'user'])
  role?: string;
}
