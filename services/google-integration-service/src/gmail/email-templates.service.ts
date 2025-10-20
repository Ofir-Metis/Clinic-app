/**
 * EmailTemplatesService - Manage and render email templates
 * Professional clinic communication templates
 */

import { Injectable, Logger } from '@nestjs/common';

export interface TemplateData {
  [key: string]: any;
}

export interface RenderedTemplate {
  html: string;
  text: string;
}

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  private templates = new Map<string, {
    subject: string;
    html: string;
    text: string;
  }>();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize default email templates
   */
  private initializeTemplates(): void {
    // Appointment Confirmation Template
    this.templates.set('appointment-confirmation', {
      subject: 'Appointment Confirmation - {{appointmentDate}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✅ Appointment Confirmed</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your therapy session has been scheduled</p>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.85); padding: 25px; border-radius: 12px; border: 1px solid rgba(46, 125, 107, 0.1); margin-bottom: 20px;">
            <h2 style="color: #2E7D6B; margin-top: 0; font-size: 20px;">Hello {{patientName}},</h2>
            <p style="line-height: 1.6; font-size: 16px;">Your appointment with <strong>{{therapistName}}</strong> has been confirmed for:</p>
            
            <div style="background: #F0F8F4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E7D6B;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2E7D6B;">📅 {{appointmentDate}} at {{appointmentTime}}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Duration: {{duration}} minutes</p>
              {{#if location}}
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">📍 Location: {{location}}</p>
              {{/if}}
              {{#if meetingUrl}}
              <p style="margin: 10px 0 0 0;">
                <a href="{{meetingUrl}}" style="background: #F4A261; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">🎥 Join Google Meet</a>
              </p>
              {{/if}}
            </div>
            
            {{#if notes}}
            <div style="background: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F4A261;">
              <h4 style="margin: 0 0 10px 0; color: #E8934A;">📝 Notes:</h4>
              <p style="margin: 0; line-height: 1.6;">{{notes}}</p>
            </div>
            {{/if}}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Need to reschedule or have questions?</p>
            <p style="color: #666; font-size: 14px;">Reply to this email or contact our office.</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            <p>This is an automated confirmation. Please save this information for your records.</p>
          </div>
        </div>
      `,
      text: `
        APPOINTMENT CONFIRMED ✅
        
        Hello {{patientName}},
        
        Your appointment with {{therapistName}} has been confirmed for:
        
        📅 Date: {{appointmentDate}}
        ⏰ Time: {{appointmentTime}}
        ⏱️ Duration: {{duration}} minutes
        {{#if location}}📍 Location: {{location}}{{/if}}
        {{#if meetingUrl}}🎥 Google Meet: {{meetingUrl}}{{/if}}
        
        {{#if notes}}
        📝 Notes: {{notes}}
        {{/if}}
        
        Need to reschedule or have questions? Reply to this email or contact our office.
        
        This is an automated confirmation. Please save this information for your records.
      `
    });

    // Appointment Reminder Template
    this.templates.set('appointment-reminder', {
      subject: 'Appointment Reminder - {{appointmentTime}} {{#if hoursUntil}}({{hoursUntil}} hours){{/if}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #F4A261 0%, #E8934A 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">⏰ Appointment Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your session is coming up</p>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.85); padding: 25px; border-radius: 12px; border: 1px solid rgba(244, 162, 97, 0.2); margin-bottom: 20px;">
            <h2 style="color: #E8934A; margin-top: 0; font-size: 20px;">Hi {{patientName}},</h2>
            <p style="line-height: 1.6; font-size: 16px;">This is a friendly reminder about your upcoming appointment with <strong>{{therapistName}}</strong>:</p>
            
            <div style="background: #FFF8F0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F4A261;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #E8934A;">📅 {{appointmentDate}} at {{appointmentTime}}</p>
              {{#if hoursUntil}}
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">⏰ Starting in {{hoursUntil}} hours</p>
              {{/if}}
              {{#if location}}
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">📍 Location: {{location}}</p>
              {{/if}}
              {{#if meetingUrl}}
              <p style="margin: 15px 0 0 0;">
                <a href="{{meetingUrl}}" style="background: #2E7D6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">🎥 Join Google Meet</a>
              </p>
              {{/if}}
            </div>
            
            <div style="background: #F0F8F4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #2E7D6B;">💡 Preparation Tips:</h4>
              <ul style="margin: 0; padding: 0 0 0 20px; line-height: 1.6;">
                <li>Arrive 5-10 minutes early</li>
                {{#if meetingUrl}}<li>Test your camera and microphone</li>{{/if}}
                <li>Prepare any questions or topics to discuss</li>
                <li>Ensure you're in a quiet, private space</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Need to reschedule? Please contact us as soon as possible.</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            <p>We look forward to seeing you soon!</p>
          </div>
        </div>
      `,
      text: `
        APPOINTMENT REMINDER ⏰
        
        Hi {{patientName}},
        
        This is a friendly reminder about your upcoming appointment with {{therapistName}}:
        
        📅 Date: {{appointmentDate}}
        ⏰ Time: {{appointmentTime}}
        {{#if hoursUntil}}⏱️ Starting in: {{hoursUntil}} hours{{/if}}
        {{#if location}}📍 Location: {{location}}{{/if}}
        {{#if meetingUrl}}🎥 Google Meet: {{meetingUrl}}{{/if}}
        
        💡 Preparation Tips:
        - Arrive 5-10 minutes early
        {{#if meetingUrl}}- Test your camera and microphone{{/if}}
        - Prepare any questions or topics to discuss
        - Ensure you're in a quiet, private space
        
        Need to reschedule? Please contact us as soon as possible.
        
        We look forward to seeing you soon!
      `
    });

    // Appointment Cancellation Template
    this.templates.set('appointment-cancellation', {
      subject: 'Appointment Cancelled - {{appointmentDate}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #8B5A87 0%, #6B446A 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📅 Appointment Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We apologize for any inconvenience</p>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.85); padding: 25px; border-radius: 12px; border: 1px solid rgba(139, 90, 135, 0.2); margin-bottom: 20px;">
            <h2 style="color: #8B5A87; margin-top: 0; font-size: 20px;">Dear {{patientName}},</h2>
            <p style="line-height: 1.6; font-size: 16px;">We regret to inform you that your appointment with <strong>{{therapistName}}</strong> scheduled for the following time has been cancelled:</p>
            
            <div style="background: #FAF0F9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5A87;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #8B5A87;">📅 {{appointmentDate}} at {{appointmentTime}}</p>
            </div>
            
            {{#if cancellationReason}}
            <div style="background: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F4A261;">
              <h4 style="margin: 0 0 10px 0; color: #E8934A;">📝 Reason:</h4>
              <p style="margin: 0; line-height: 1.6;">{{cancellationReason}}</p>
            </div>
            {{/if}}
            
            <div style="background: #F0F8F4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #2E7D6B;">🔄 Next Steps:</h4>
              <p style="margin: 0 0 15px 0; line-height: 1.6;">We understand that cancellations can be disruptive to your schedule. Please reach out to us to reschedule your appointment at your earliest convenience.</p>
              {{#if rescheduleUrl}}
              <p style="margin: 15px 0 0 0;">
                <a href="{{rescheduleUrl}}" style="background: #2E7D6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">📅 Reschedule Now</a>
              </p>
              {{/if}}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">We sincerely apologize for any inconvenience this may cause.</p>
            <p style="color: #666; font-size: 14px;">Please don't hesitate to contact us if you have any questions.</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            <p>Thank you for your understanding.</p>
          </div>
        </div>
      `,
      text: `
        APPOINTMENT CANCELLED 📅
        
        Dear {{patientName}},
        
        We regret to inform you that your appointment with {{therapistName}} has been cancelled:
        
        📅 Date: {{appointmentDate}}
        ⏰ Time: {{appointmentTime}}
        
        {{#if cancellationReason}}
        📝 Reason: {{cancellationReason}}
        {{/if}}
        
        🔄 Next Steps:
        We understand that cancellations can be disruptive to your schedule. Please reach out to us to reschedule your appointment at your earliest convenience.
        
        {{#if rescheduleUrl}}
        📅 Reschedule: {{rescheduleUrl}}
        {{/if}}
        
        We sincerely apologize for any inconvenience this may cause.
        Please don't hesitate to contact us if you have any questions.
        
        Thank you for your understanding.
      `
    });

    this.logger.log('Email templates initialized');
  }

  /**
   * Render a template with data
   */
  async renderTemplate(templateId: string, data: TemplateData): Promise<RenderedTemplate> {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      const html = this.interpolate(template.html, data);
      const text = this.interpolate(template.text, data);

      return { html, text };
    } catch (error) {
      this.logger.error(`Failed to render template ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Template rendering failed: ${templateId}`);
    }
  }

  /**
   * Simple template interpolation (Handlebars-like syntax)
   */
  private interpolate(template: string, data: TemplateData): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      
      // Handle conditional blocks {{#if condition}}...{{/if}}
      if (trimmedKey.startsWith('#if ')) {
        const condition = trimmedKey.substring(4).trim();
        const value = this.getValue(data, condition);
        if (!value) {
          // Remove the entire conditional block
          const ifPattern = new RegExp(`\\{\\{#if\\s+${condition}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g');
          return template.replace(ifPattern, '');
        }
        // Remove just the if tags, keep the content
        return template.replace(/\{\{#if\s+.*?\}\}/, '').replace(/\{\{\/if\}\}/, '');
      }
      
      // Handle closing if tags
      if (trimmedKey === '/if') {
        return '';
      }
      
      // Regular variable substitution
      const value = this.getValue(data, trimmedKey);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from data object
   */
  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): Array<{
    id: string;
    subject: string;
    description: string;
  }> {
    return [
      {
        id: 'appointment-confirmation',
        subject: 'Appointment Confirmation',
        description: 'Professional confirmation email sent when appointments are booked'
      },
      {
        id: 'appointment-reminder',
        subject: 'Appointment Reminder',
        description: 'Friendly reminder sent before appointments'
      },
      {
        id: 'appointment-cancellation',
        subject: 'Appointment Cancellation',
        description: 'Apologetic cancellation notice with reschedule options'
      }
    ];
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(templateId: string): Promise<RenderedTemplate> {
    const sampleData = {
      patientName: 'John Smith',
      therapistName: 'Dr. Sarah Johnson',
      appointmentDate: new Date().toLocaleDateString(),
      appointmentTime: '2:00 PM',
      duration: 60,
      location: 'Wellness Clinic, Room 205',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      notes: 'Please bring any questions or concerns you\'d like to discuss.',
      hoursUntil: 24,
      cancellationReason: 'Therapist illness - we apologize for the short notice.',
      rescheduleUrl: 'https://clinic.example.com/reschedule'
    };

    return await this.renderTemplate(templateId, sampleData);
  }
}