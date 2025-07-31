import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ChunkedUploadService } from './chunked-upload.service';
import { RecordingUploadController } from './recording-upload.controller';
import { TestRecordingController } from './test-recording.controller';
import { RecordingUpload } from './recording-upload.entity';
import { RecordingChunk } from './recording-chunk.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordingUpload, RecordingChunk]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    })
  ],
  providers: [FilesService, ChunkedUploadService, Logger],
  controllers: [FilesController, TestRecordingController, RecordingUploadController],
  exports: [ChunkedUploadService],
})
export class FilesModule {}
