import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@clinic/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const CLIENT_RELATIONSHIPS_URL = process.env.CLIENT_RELATIONSHIPS_URL || 'http://client-relationships-service:3014';

interface SendMessageDto {
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments?: { id: string; name: string; url: string; type: string }[];
}

@Controller('communication')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly httpService: HttpService) {}

  @Get('messages')
  async getMessages(
    @Query('threadId') threadId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /communication/messages - threadId: ${threadId}, traceId: ${traceId}`);

    const params = new URLSearchParams();
    params.append('threadId', threadId);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const { data } = await firstValueFrom(
      this.httpService.get(`${CLIENT_RELATIONSHIPS_URL}/api/v1/communication/messages?${params.toString()}`, {
        headers: { 'X-Trace-Id': traceId || '' },
      }),
    );
    return data;
  }

  @Get('messages/:id')
  async getMessage(
    @Param('id') id: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /communication/messages/${id}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${CLIENT_RELATIONSHIPS_URL}/api/v1/communication/messages/${id}`, {
        headers: { 'X-Trace-Id': traceId || '' },
      }),
    );
    return data;
  }

  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`POST /communication/messages - threadId: ${dto.threadId}`);

    const { data } = await firstValueFrom(
      this.httpService.post(`${CLIENT_RELATIONSHIPS_URL}/api/v1/communication/messages`, dto, {
        headers: { 'X-Trace-Id': traceId || '' },
      }),
    );
    return data;
  }

  @Post('messages/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @Body('ids') ids: string[],
    @Headers('x-user-id') userId: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`POST /communication/messages/read - ${ids?.length || 0} messages`);

    await firstValueFrom(
      this.httpService.post(
        `${CLIENT_RELATIONSHIPS_URL}/api/v1/communication/messages/read`,
        { ids },
        {
          headers: {
            'X-Trace-Id': traceId || '',
            'X-User-Id': userId || '',
          },
        },
      ),
    );
  }

  @Get('unread-count')
  async getUnreadCount(
    @Headers('x-user-id') userId: string,
    @Headers('x-trace-id') traceId?: string,
  ) {
    this.logger.log(`GET /communication/unread-count - userId: ${userId}`);

    const { data } = await firstValueFrom(
      this.httpService.get(`${CLIENT_RELATIONSHIPS_URL}/api/v1/communication/unread-count`, {
        headers: {
          'X-Trace-Id': traceId || '',
          'X-User-Id': userId || '',
        },
      }),
    );
    return data;
  }
}
