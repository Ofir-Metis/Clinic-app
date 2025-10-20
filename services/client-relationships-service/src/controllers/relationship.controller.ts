import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RelationshipService } from '../services/relationship.service';

@Controller('relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Get()
  findAll() {
    return { message: 'Get all relationships' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `Get relationship ${id}` };
  }
}