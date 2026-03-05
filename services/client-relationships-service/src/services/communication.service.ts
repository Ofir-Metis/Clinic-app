import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from '../entities/message.entity';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async getMessages(threadId: string, limit = 50, offset = 0): Promise<Message[]> {
    this.logger.log(`Getting messages for thread ${threadId}`);

    return this.messageRepo.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async sendMessage(dto: SendMessageDto): Promise<Message> {
    this.logger.log(`Sending message from ${dto.senderId} to ${dto.recipientId}`);

    const message = this.messageRepo.create({
      threadId: dto.threadId,
      senderId: dto.senderId,
      recipientId: dto.recipientId,
      content: dto.content,
      attachments: dto.attachments,
    });

    const saved = await this.messageRepo.save(message);

    // TODO: Emit event via NATS for real-time notifications
    // this.natsClient.emit('message.sent', { message: saved });

    return saved;
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    this.logger.log(`Marking ${messageIds.length} messages as read for user ${userId}`);

    await this.messageRepo.update(
      {
        id: In(messageIds),
        recipientId: userId,
        readAt: undefined as any, // Only update unread messages
      },
      {
        readAt: new Date(),
      },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo.count({
      where: {
        recipientId: userId,
        readAt: undefined as any,
      },
    });
  }

  async getMessage(id: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with id ${id} not found`);
    }
    return message;
  }
}
