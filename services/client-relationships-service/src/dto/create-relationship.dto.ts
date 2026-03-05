import { IsUUID, IsEnum, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelationshipType, DataAccessLevel } from '../entities/client-coach-relationship.entity';

/**
 * DTO for creating a new client-coach relationship
 */
export class CreateRelationshipDto {
  @ApiProperty({ description: 'Client ID', format: 'uuid' })
  @IsUUID(4)
  clientId: string;

  @ApiProperty({ description: 'Coach ID', format: 'uuid' })
  @IsUUID(4)
  coachId: string;

  @ApiProperty({
    description: 'Type of coaching relationship',
    enum: RelationshipType,
    default: RelationshipType.SECONDARY
  })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType = RelationshipType.SECONDARY;

  @ApiProperty({
    description: 'Level of data access for the coach',
    enum: DataAccessLevel,
    default: DataAccessLevel.LIMITED
  })
  @IsEnum(DataAccessLevel)
  dataAccessLevel: DataAccessLevel = DataAccessLevel.LIMITED;

  @ApiPropertyOptional({ description: 'Focus areas for the coaching relationship', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];

  @ApiPropertyOptional({ description: "Coach's specialization for this client" })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Coaching preferences', type: 'object' })
  @IsOptional()
  coachingPreferences?: any;

  @ApiPropertyOptional({ description: 'Privacy settings', type: 'object' })
  @IsOptional()
  privacySettings?: any;

  @ApiPropertyOptional({ description: 'Program details', type: 'object' })
  @IsOptional()
  programDetails?: any;

  @ApiProperty({ description: 'User ID who initiated the relationship', format: 'uuid' })
  @IsUUID(4)
  invitedBy: string;

  @ApiPropertyOptional({ description: 'Message accompanying the invitation' })
  @IsOptional()
  @IsString()
  invitationMessage?: string;
}
