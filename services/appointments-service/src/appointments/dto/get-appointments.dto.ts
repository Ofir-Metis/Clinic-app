import { IsEnum, IsOptional } from 'class-validator';

export class GetAppointmentsDto {
  therapistId!: number;

  @IsOptional()
  @IsEnum(['calendar', 'list'])
  view?: 'calendar' | 'list';
}
