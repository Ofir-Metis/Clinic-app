import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { ClientsService } from './clients.service';
import { GetPatientsDto } from './dto/get-clients.dto';
import { GetSessionsDto } from './dto/get-sessions.dto';
import { CreatePatientDto } from './dto/create-client.dto';

/**
 * Controller exposing client list endpoints.
 */
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly service: ClientsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query() query: GetPatientsDto, @Req() req: any) {
    if (req.user?.id !== query.therapistId) {
      throw new ForbiddenException();
    }
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.service.list(query.therapistId, page, limit, query.search);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/sessions')
  getSessions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetSessionsDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.service.sessions(id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/files')
  getFiles(@Param('id', ParseIntPipe) id: number) {
    return this.service.files(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/billing')
  getBilling(@Param('id', ParseIntPipe) id: number) {
    return this.service.billing(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async add(@Body() dto: CreatePatientDto, @Request() req: any) {
    const { client, existing } = await this.service.addOrInvite(dto, req.user.id);
    if (client) {
      // TODO: Add notification service integration later
      return { id: client.id, existing };
    } else {
      return { id: null, existing };
    }
  }
}
