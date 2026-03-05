import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetAppointmentsDto {
  @IsString()
  @IsOptional()
  coachId?: string;

  @IsOptional()
  @IsEnum(['calendar', 'list'])
  view?: 'calendar' | 'list';
}
