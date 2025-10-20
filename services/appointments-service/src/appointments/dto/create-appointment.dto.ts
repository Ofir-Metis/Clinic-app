import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsArray } from 'class-validator';
import { MeetingType } from '../appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  therapistId!: string;
  
  @IsString()
  clientId!: string;
  
  @IsDateString()
  startTime!: string;
  
  @IsDateString()
  endTime!: string;
  
  @IsString()
  title!: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsEnum(['in-person', 'online', 'hybrid'])
  meetingType!: MeetingType;
  
  @IsString()
  createdBy!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;
  
  @IsOptional()
  @IsArray()
  reminderTimes?: string[];
  
  @IsOptional()
  clientPreferences?: {
    preferredNotificationMethod: 'email' | 'sms' | 'both';
    allowRecording: boolean;
    requireConfirmation: boolean;
  };
  
  @IsOptional()
  @IsArray()
  tags?: string[];
}
