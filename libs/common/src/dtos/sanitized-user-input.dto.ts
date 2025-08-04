import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize, StrictSanitize } from '../pipes/sanitization.pipe';

export class CreateUserDto {
  @IsEmail()
  @Sanitize()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Sanitize()
  password: string;

  @IsString()
  @MaxLength(100)
  @StrictSanitize() // Remove all HTML from names
  firstName: string;

  @IsString()
  @MaxLength(100)
  @StrictSanitize()
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Sanitize() // Allow some HTML but sanitize dangerous content
  bio?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @StrictSanitize()
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @StrictSanitize()
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Sanitize()
  bio?: string;
}

export class CreateNoteDto {
  @IsString()
  @MaxLength(200)
  @StrictSanitize()
  title: string;

  @IsString()
  @MaxLength(10000)
  @Sanitize() // Allow rich text but sanitize dangerous content
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Sanitize()
  tags?: string;
}

export class CreateSessionDto {
  @IsString()
  @MaxLength(200)
  @StrictSanitize()
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Sanitize()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Sanitize()
  notes?: string;
}