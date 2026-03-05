import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { RelationshipService } from '../services/relationship.service';
import { CreateRelationshipDto } from '../dto/create-relationship.dto';
import { RelationshipStatus } from '../entities/client-coach-relationship.entity';

interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('relationships')
@Controller('relationships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  /**
   * Create a connection request between client and coach
   */
  @Post()
  @ApiOperation({ summary: 'Create a client-coach relationship request' })
  async createRelationship(
    @Body() dto: CreateRelationshipDto,
    @Req() req: AuthRequest
  ) {
    // Set invitedBy to the current user
    dto.invitedBy = req.user.id;
    return this.relationshipService.createRelationship(dto);
  }

  /**
   * Get all relationships for a client - MUST be before :id route
   */
  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all relationships for a client' })
  async getClientRelationships(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('status') status?: RelationshipStatus
  ) {
    return this.relationshipService.findRelationships({
      clientId,
      status
    });
  }

  /**
   * Get all relationships for a coach - MUST be before :id route
   */
  @Get('coach/:coachId')
  @ApiOperation({ summary: 'Get all relationships for a coach' })
  async getCoachRelationships(
    @Param('coachId', ParseUUIDPipe) coachId: string,
    @Query('status') status?: RelationshipStatus
  ) {
    return this.relationshipService.findRelationships({
      coachId,
      status
    });
  }

  /**
   * Update relationship status (accept/reject/terminate)
   */
  @Put(':id/status')
  @ApiOperation({ summary: 'Update relationship status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: RelationshipStatus; reason?: string },
    @Req() req: AuthRequest
  ) {
    const { status, reason } = body;

    if (!status) {
      throw new BadRequestException('Status is required');
    }

    switch (status) {
      case RelationshipStatus.ACTIVE:
        return this.relationshipService.acceptRelationship(id, req.user.id);
      case RelationshipStatus.TERMINATED:
        return this.relationshipService.rejectRelationship(id, req.user.id, reason);
      default:
        return this.relationshipService.updateRelationship(id, { status });
    }
  }

  /**
   * Get relationship by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get relationship by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.relationshipService.findById(id);
  }
}