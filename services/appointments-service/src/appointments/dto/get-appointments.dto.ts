import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class GetAppointmentsDto {
  @IsInt()
  therapistId: number;

  @IsOptional()
  @IsEnum(['calendar', 'list'])
  view?: 'calendar' | 'list';
}
