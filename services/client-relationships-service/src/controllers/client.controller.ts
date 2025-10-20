import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ClientService } from '../services/client.service';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll() {
    return { message: 'Get all clients' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get client ${id}` };
  }
}