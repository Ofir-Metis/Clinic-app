import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  therapistId!: number;
  clientId!: number;
  startTime!: string;
  endTime!: string;
  type!: 'in-person' | 'virtual';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;
}
