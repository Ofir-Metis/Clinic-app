/**
 * Notifications Service - Enterprise-grade notification management
 * Handles email, SMS, and in-app notifications with healthcare compliance
 */

import { Injectable } from '@nestjs/common';
import { CentralizedLoggerService } from '@clinic/common';

export interface NotificationRequest {
  type: 'email' | 'sms' | 'push' | 'in_app';
  recipient: string;
  subject?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  status: 'sent' | 'pending' | 'failed';
  timestamp: Date;
  error?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly logger: CentralizedLoggerService) {}

  /**
   * Send notification via external notifications service
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    try {
      this.logger.auditLog('Notification request initiated', {
        notificationType: request.type,
        priority: request.priority,
        recipient: this.maskRecipient(request.recipient),
        dataType: 'general',
        auditRequired: true
      });

      // In a real implementation, this would call the external notifications service
      // For now, we'll simulate the response
      const response: NotificationResponse = {
        id: this.generateNotificationId(),
        status: 'sent',
        timestamp: new Date()
      };

      this.logger.log(`Notification sent successfully: ${response.id}`);
      
      return response;
    } catch (error) {
      this.logger.error('Failed to send notification', error.stack, 'NotificationsService');
      
      return {
        id: this.generateNotificationId(),
        status: 'failed',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(requests: NotificationRequest[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.sendNotification(request))
    );

    return results.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            id: this.generateNotificationId(),
            status: 'failed' as const,
            timestamp: new Date(),
            error: result.reason?.message || 'Unknown error'
          }
    );
  }

  private maskRecipient(recipient: string): string {
    if (recipient.includes('@')) {
      // Email masking
      const [local, domain] = recipient.split('@');
      return `${local.charAt(0)}***@${domain}`;
    } else {
      // Phone number masking
      return `***${recipient.slice(-4)}`;
    }
  }

  /**
   * Send performance alert notification
   */
  async sendPerformanceAlert(alert: any): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'email',
      recipient: 'admin@clinic.com', // Should be configurable
      subject: `Performance Alert: ${alert.alertType}`,
      message: `Performance alert detected: ${alert.message}`,
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
      metadata: {
        alertType: alert.alertType,
        severity: alert.severity,
        serviceName: alert.serviceName
      }
    });
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}