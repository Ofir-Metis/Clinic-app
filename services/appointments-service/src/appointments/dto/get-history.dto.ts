import { IsInt, IsOptional } from 'class-validator';

/**
 * Query parameters for appointment history.
 */
export class GetHistoryDto {
  @IsInt()
  therapistId: number;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
