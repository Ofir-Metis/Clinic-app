import { IsInt, IsOptional } from 'class-validator';

/**
 * Query parameters for appointment history.
 */
export class GetHistoryDto {
  therapistId!: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
