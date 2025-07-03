import { IsDateString, IsEnum, IsInt, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  therapistId: number;

  @IsInt()
  clientId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  type: string;

  @IsString()
  location: string;
}
