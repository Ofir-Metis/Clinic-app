import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { SessionNote } from './session-note.entity';
import { Invoice } from './invoice.entity';
import { NotifierService } from './notifier.service';
import { MockJwtService } from '../mock-jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, SessionNote, Invoice])],
  controllers: [ClientsController],
  providers: [ClientsService, NotifierService, MockJwtService],
})
export class ClientsModule {}
