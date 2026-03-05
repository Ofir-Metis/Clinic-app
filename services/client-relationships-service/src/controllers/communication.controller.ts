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
} from '@nestjs/common';
import { CommunicationService } from '../services/communication.service';
import { SendMessageDto } from '../dto/send-message.dto';

@Controller('communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly service: CommunicationService) {}

  @Get('messages')
  async getMessages(
    @Query('threadId') threadId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(`GET /communication/messages - threadId: ${threadId}`);
    return this.service.getMessages(
      threadId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('messages/:id')
  async getMessage(@Param('id') id: string) {
    this.logger.log(`GET /communication/messages/${id}`);
    return this.service.getMessage(id);
  }

  @Post('messages')
  async sendMessage(@Body() dto: SendMessageDto) {
    this.logger.log(`POST /communication/messages`);
    return this.service.sendMessage(dto);
  }

  @Post('messages/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @Body('ids') ids: string[],
    @Headers('x-user-id') userId: string,
  ) {
    this.logger.log(`POST /communication/messages/read - ${ids.length} messages`);
    await this.service.markAsRead(ids, userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    this.logger.log(`GET /communication/unread-count - userId: ${userId}`);
    const count = await this.service.getUnreadCount(userId);
    return { count };
  }
}
