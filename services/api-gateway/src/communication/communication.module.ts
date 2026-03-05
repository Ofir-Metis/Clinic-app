import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [HttpModule],
  controllers: [CommunicationController],
})
export class CommunicationModule {}
