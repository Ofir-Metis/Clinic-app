/**
 * ProgramsModule - Module for coaching program templates and curriculum management
 * Handles program creation, enrollment, progress tracking, and certification
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@clinic/common';
import { ProgramTemplatesService } from './program-templates.service';
import { ProgramsController } from './programs.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  providers: [ProgramTemplatesService],
  controllers: [ProgramsController],
  exports: [ProgramTemplatesService],
})
export class ProgramsModule {}