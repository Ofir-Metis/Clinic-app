/**
 * WebSocketModule - Module for WebSocket functionality
 * Handles real-time communication for coaching sessions
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '@clinic/common';
import { RecordingStatusGateway } from './recording-status.gateway';

@Module({
  imports: [AuthModule],
  providers: [RecordingStatusGateway],
  exports: [RecordingStatusGateway],
})
export class WebSocketModule {}