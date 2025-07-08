import { IsInt, IsOptional } from 'class-validator';

export class GetSessionsDto {
  @IsInt()
  @IsOptional()
  page!: number;

  @IsInt()
  @IsOptional()
  limit!: number;
}
