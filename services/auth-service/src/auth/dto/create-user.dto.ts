import { IsEmail, IsString, MinLength, IsOptional, IsIn, Matches, MaxLength } from 'class-validator';

/**
 * DTO for user registration.
 * Roles: 'therapist'/'coach' (mapped internally), 'patient'/'client' (mapped internally), 'user', 'admin'
 */
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @IsOptional()
  @IsIn(['therapist', 'patient', 'user', 'admin', 'client', 'coach'])
  role?: string;
}
