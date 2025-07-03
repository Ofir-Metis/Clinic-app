import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  therapistId: number;

  @IsInt()
  clientId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(['in-person', 'virtual'])
  type: 'in-person' | 'virtual';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;
}
