import { IsString, IsOptional } from 'class-validator';

/**
 * DTO representing a single setting update.
 */
export class UpdateSettingDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
