/**
 * ViewSwitchingController - API endpoints for therapist-client view switching
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '@clinic/common/auth/jwt-auth.guard';
import { ViewSwitchingGuard, ViewSwitching } from '@clinic/common/auth/view-switching.guard';
import { ViewSwitchingService } from './view-switching.service';

export interface SwitchToClientRequest {
  clientId: string;
}

export interface ViewSwitchingResponse {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user?: {
    id: string;
    email: string;
    role: string;
    isImpersonating: boolean;
    originalUserId?: string;
    viewingAsClientId?: string;
  };
  message: string;
}

@Controller('view-switching')
@UseGuards(JwtAuthGuard, ViewSwitchingGuard)
export class ViewSwitchingController {
  private readonly logger = new Logger(ViewSwitchingController.name);

  constructor(private viewSwitchingService: ViewSwitchingService) {}

  /**
   * Switch to client view
   */
  @Post('switch-to-client')
  @ViewSwitching({ 
    allowImpersonation: false, 
    requireOriginalRole: 'coach',
    restrictToOwnClients: true 
  })
  async switchToClient(
    @Body() body: SwitchToClientRequest,
    @Request() req: any,
  ): Promise<ViewSwitchingResponse> {
    try {
      const therapistPayload = req.user;
      const { clientId } = body;

      if (!clientId) {
        throw new HttpException('Client ID is required', HttpStatus.BAD_REQUEST);
      }

      // Verify therapist can access this client
      const canAccess = await this.viewSwitchingService.canTherapistAccessClient(
        therapistPayload.sub,
        clientId
      );

      if (!canAccess) {
        throw new HttpException(
          'You do not have access to this client',
          HttpStatus.FORBIDDEN
        );
      }

      // Get client information
      const clientInfo = await this.viewSwitchingService.getClientInfo(clientId);
      if (!clientInfo) {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }

      // Generate impersonation token
      const tokens = await this.viewSwitchingService.switchToClientView(
        therapistPayload,
        clientId,
        clientInfo.email
      );

      this.logger.log(
        `🎭 Therapist ${therapistPayload.sub} switched to client view for ${clientId}`
      );

      return {
        success: true,
        tokens,
        user: {
          id: clientId,
          email: clientInfo.email,
          role: 'client',
          isImpersonating: true,
          originalUserId: therapistPayload.sub,
          viewingAsClientId: clientId,
        },
        message: `Switched to client view for ${clientInfo.name}`,
      };
    } catch (error) {
      this.logger.error('Failed to switch to client view:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to switch to client view',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Return to therapist view
   */
  @Post('exit-impersonation')
  @ViewSwitching({ 
    allowImpersonation: true,
    requireOriginalRole: 'coach' 
  })
  async exitImpersonation(@Request() req: any): Promise<ViewSwitchingResponse> {
    try {
      const currentPayload = req.user;

      if (!currentPayload.isImpersonating) {
        throw new HttpException(
          'Not currently in client view',
          HttpStatus.BAD_REQUEST
        );
      }

      const tokens = await this.viewSwitchingService.exitClientView(
        req.headers.authorization.replace('Bearer ', '')
      );

      // Get therapist information
      const therapistInfo = await this.viewSwitchingService.getTherapistInfo(
        currentPayload.originalUserId
      );

      this.logger.log(
        `🎭 Therapist ${currentPayload.originalUserId} exited client view for ${currentPayload.viewingAsClientId}`
      );

      return {
        success: true,
        tokens,
        user: {
          id: currentPayload.originalUserId,
          email: therapistInfo.email,
          role: 'coach',
          isImpersonating: false,
        },
        message: 'Returned to therapist view',
      };
    } catch (error) {
      this.logger.error('Failed to exit impersonation:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to exit client view',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current view switching status
   */
  @Get('status')
  @ViewSwitching({ allowImpersonation: true })
  getCurrentStatus(@Request() req: any): ViewSwitchingResponse {
    const payload = req.user;
    const viewSwitching = req.viewSwitching;

    return {
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        isImpersonating: viewSwitching.isImpersonating,
        originalUserId: viewSwitching.originalUserId,
        viewingAsClientId: viewSwitching.viewingAsClientId,
      },
      message: viewSwitching.isImpersonating 
        ? `Viewing as client ${viewSwitching.viewingAsClientId}`
        : 'In normal therapist view',
    };
  }

  /**
   * Get list of clients accessible for view switching
   */
  @Get('accessible-clients')
  @ViewSwitching({ 
    allowImpersonation: false,
    requireOriginalRole: 'coach' 
  })
  async getAccessibleClients(@Request() req: any) {
    try {
      const therapistPayload = req.user;
      const clients = await this.viewSwitchingService.getTherapistClients(
        therapistPayload.sub
      );

      return {
        success: true,
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          avatar: client.avatar,
          lastActive: client.lastActive,
        })),
        message: `Found ${clients.length} accessible clients`,
      };
    } catch (error) {
      this.logger.error('Failed to get accessible clients:', error);
      
      throw new HttpException(
        'Failed to retrieve client list',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get client info by ID (for therapists)
   */
  @Get('client/:clientId')
  @ViewSwitching({ 
    allowImpersonation: false,
    requireOriginalRole: 'coach',
    restrictToOwnClients: true 
  })
  async getClientInfo(@Param('clientId') clientId: string, @Request() req: any) {
    try {
      const therapistPayload = req.user;

      // Verify access
      const canAccess = await this.viewSwitchingService.canTherapistAccessClient(
        therapistPayload.sub,
        clientId
      );

      if (!canAccess) {
        throw new HttpException(
          'You do not have access to this client',
          HttpStatus.FORBIDDEN
        );
      }

      const clientInfo = await this.viewSwitchingService.getClientInfo(clientId);
      if (!clientInfo) {
        throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        client: clientInfo,
        message: 'Client information retrieved',
      };
    } catch (error) {
      this.logger.error('Failed to get client info:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve client information',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}