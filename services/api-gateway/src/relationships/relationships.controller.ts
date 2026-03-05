import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { RelationshipsService } from './relationships.service';

@ApiTags('relationships')
@Controller('relationships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RelationshipsController {
  constructor(private readonly service: RelationshipsService) {}

  /**
   * Create a connection request between client and coach
   */
  @Post()
  @ApiOperation({ summary: 'Create a client-coach relationship request' })
  @ApiResponse({ status: 201, description: 'Relationship created successfully' })
  async createRelationship(
    @Body() dto: any,
    @Headers('authorization') auth: string
  ) {
    return this.service.createRelationship(dto, auth);
  }

  /**
   * Get all relationships for a client - MUST be before :id route
   */
  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all relationships for a client' })
  async getClientRelationships(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('status') status?: string,
    @Headers('authorization') auth?: string
  ) {
    return this.service.getClientRelationships(clientId, status, auth);
  }

  /**
   * Get all relationships for a coach - MUST be before :id route
   */
  @Get('coach/:coachId')
  @ApiOperation({ summary: 'Get all relationships for a coach' })
  async getCoachRelationships(
    @Param('coachId', ParseUUIDPipe) coachId: string,
    @Query('status') status?: string,
    @Headers('authorization') auth?: string
  ) {
    return this.service.getCoachRelationships(coachId, status, auth);
  }

  /**
   * Update relationship status (accept/reject/terminate)
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update relationship status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; reason?: string },
    @Headers('authorization') auth: string
  ) {
    return this.service.updateRelationshipStatus(id, body, auth);
  }

  /**
   * Get relationship by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get relationship by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') auth?: string
  ) {
    return this.service.getRelationship(id, auth);
  }
}
