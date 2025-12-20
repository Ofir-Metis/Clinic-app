import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SubscriptionInvoice } from '../entities/subscription-invoice.entity';
import { ClientCoachPayment } from '../entities/client-coach-payment.entity';
import { CoachSubscription } from '../entities/coach-subscription.entity';

interface NotificationTemplate {
  type: 'email' | 'sms' | 'push';
  subject: string;
  body: string;
  variables: Record<string, string>;
}

interface PaymentReminder {
  recipientId: string;
  recipientEmail: string;
  recipientPhone?: string;
  amount: number;
  currency: string;
  dueDate: Date;
  invoiceNumber?: string;
  paymentLink?: string;
  reminderType: 'first' | 'second' | 'final' | 'overdue';
}

@Injectable()
export class BillingNotificationsService {
  private readonly logger = new Logger(BillingNotificationsService.name);

  constructor(
    @InjectRepository(SubscriptionInvoice)
    private invoiceRepository: Repository<SubscriptionInvoice>,
    @InjectRepository(ClientCoachPayment)
    private paymentRepository: Repository<ClientCoachPayment>,
    @InjectRepository(CoachSubscription)
    private subscriptionRepository: Repository<CoachSubscription>,
    private configService: ConfigService,
  ) {}

  /**
   * Send payment reminders daily at 9 AM
   */
  @Cron('0 9 * * *') // Daily at 9 AM
  async sendDailyPaymentReminders(): Promise<void> {
    this.logger.log('Starting daily payment reminder process');

    try {
      await Promise.all([
        this.sendSubscriptionReminders(),
        this.sendClientPaymentReminders(),
        this.sendOverdueNotifications(),
      ]);

      this.logger.log('Completed daily payment reminder process');
    } catch (error) {
      this.logger.error('Failed to send daily payment reminders:', error);
    }
  }

  /**
   * Send subscription payment reminders
   */
  private async sendSubscriptionReminders(): Promise<void> {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get overdue invoices
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        status: 'pending',
        dueDate: { $lt: today } as any,
      },
      relations: ['subscription', 'subscription.plan'],
    });

    // Get invoices due in 3 days (final reminder)
    const finalReminderInvoices = await this.invoiceRepository.find({
      where: {
        status: 'pending',
        dueDate: { $gte: today, $lte: threeDaysFromNow } as any,
      },
      relations: ['subscription', 'subscription.plan'],
    });

    // Get invoices due in 7 days (first reminder)
    const firstReminderInvoices = await this.invoiceRepository.find({
      where: {
        status: 'pending',
        dueDate: { $gte: threeDaysFromNow, $lte: sevenDaysFromNow } as any,
      },
      relations: ['subscription', 'subscription.plan'],
    });

    // Send overdue notifications
    for (const invoice of overdueInvoices) {
      await this.sendSubscriptionPaymentReminder(invoice, 'overdue');
    }

    // Send final reminders
    for (const invoice of finalReminderInvoices) {
      await this.sendSubscriptionPaymentReminder(invoice, 'final');
    }

    // Send first reminders
    for (const invoice of firstReminderInvoices) {
      await this.sendSubscriptionPaymentReminder(invoice, 'first');
    }

    this.logger.log(`Sent subscription reminders: ${overdueInvoices.length} overdue, ${finalReminderInvoices.length} final, ${firstReminderInvoices.length} first`);
  }

  /**
   * Send client payment reminders
   */
  private async sendClientPaymentReminders(): Promise<void> {
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Get pending client payments older than 2 days
    const pendingPayments = await this.paymentRepository.find({
      where: {
        status: 'pending',
        createdAt: { $lt: twoDaysAgo } as any,
      },
    });

    for (const payment of pendingPayments) {
      await this.sendClientPaymentReminder(payment);
    }

    this.logger.log(`Sent ${pendingPayments.length} client payment reminders`);
  }

  /**
   * Send overdue notifications and handle suspensions
   */
  private async sendOverdueNotifications(): Promise<void> {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get subscriptions with overdue payments
    const overdueSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.invoices', 'invoice')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.status = :status', { status: 'past_due' })
      .andWhere('invoice.status = :invoiceStatus', { invoiceStatus: 'overdue' })
      .andWhere('invoice.dueDate < :sevenDaysAgo', { sevenDaysAgo })
      .getMany();

    for (const subscription of overdueSubscriptions) {
      await this.handleOverdueSubscription(subscription);
    }

    this.logger.log(`Processed ${overdueSubscriptions.length} overdue subscriptions`);
  }

  /**
   * Send subscription payment reminder
   */
  private async sendSubscriptionPaymentReminder(
    invoice: SubscriptionInvoice,
    reminderType: 'first' | 'final' | 'overdue'
  ): Promise<void> {
    try {
      const paymentLink = this.generatePaymentLink(invoice);
      
      const reminder: PaymentReminder = {
        recipientId: invoice.coachId,
        recipientEmail: await this.getCoachEmail(invoice.coachId),
        amount: invoice.totalAmountNis,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        invoiceNumber: invoice.invoiceNumber,
        paymentLink,
        reminderType,
      };

      const template = this.getSubscriptionReminderTemplate(reminder, invoice);
      
      await this.sendNotification({
        type: 'email',
        recipient: reminder.recipientEmail,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      });

      // Send SMS for final and overdue reminders
      if ((reminderType === 'final' || reminderType === 'overdue') && reminder.recipientPhone) {
        await this.sendNotification({
          type: 'sms',
          recipient: reminder.recipientPhone,
          subject: '',
          body: this.getSMSReminderText(reminder),
          variables: {},
        });
      }

      this.logger.log(`Sent ${reminderType} subscription reminder for invoice ${invoice.invoiceNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send subscription reminder for invoice ${invoice.invoiceNumber}:`, error);
    }
  }

  /**
   * Send client payment reminder
   */
  private async sendClientPaymentReminder(payment: ClientCoachPayment): Promise<void> {
    try {
      const paymentLink = this.generateClientPaymentLink(payment);
      
      const reminder: PaymentReminder = {
        recipientId: payment.clientId,
        recipientEmail: await this.getClientEmail(payment.clientId),
        recipientPhone: await this.getClientPhone(payment.clientId),
        amount: payment.amountNis,
        currency: payment.currency,
        dueDate: new Date(), // Client payments are due immediately
        paymentLink,
        reminderType: 'first',
      };

      const template = this.getClientPaymentReminderTemplate(reminder, payment);
      
      await this.sendNotification({
        type: 'email',
        recipient: reminder.recipientEmail,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      });

      this.logger.log(`Sent client payment reminder for payment ${payment.id}`);
    } catch (error) {
      this.logger.error(`Failed to send client payment reminder for payment ${payment.id}:`, error);
    }
  }

  /**
   * Handle overdue subscription (suspend service)
   */
  private async handleOverdueSubscription(subscription: CoachSubscription): Promise<void> {
    try {
      // Suspend subscription
      subscription.status = 'suspended';
      await this.subscriptionRepository.save(subscription);

      // Send suspension notification
      const coachEmail = await this.getCoachEmail(subscription.coachId);
      
      await this.sendNotification({
        type: 'email',
        recipient: coachEmail,
        subject: 'Service Suspended - Overdue Payment',
        body: this.getSuspensionNotificationBody(subscription),
        variables: {
          planName: subscription.plan.name,
          suspendedDate: new Date().toLocaleDateString('he-IL'),
        },
      });

      this.logger.log(`Suspended subscription ${subscription.id} due to overdue payment`);
    } catch (error) {
      this.logger.error(`Failed to handle overdue subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccessNotification(
    type: 'subscription' | 'client_payment',
    entityId: string,
    recipientEmail: string,
    amount: number,
    currency: string = 'ILS'
  ): Promise<void> {
    try {
      const template = this.getPaymentSuccessTemplate(type, amount, currency);
      
      await this.sendNotification({
        type: 'email',
        recipient: recipientEmail,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      });

      this.logger.log(`Sent payment success notification for ${type} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment success notification:`, error);
    }
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(
    type: 'subscription' | 'client_payment',
    entityId: string,
    recipientEmail: string,
    amount: number,
    reason: string,
    currency: string = 'ILS'
  ): Promise<void> {
    try {
      const template = this.getPaymentFailureTemplate(type, amount, reason, currency);
      
      await this.sendNotification({
        type: 'email',
        recipient: recipientEmail,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      });

      this.logger.log(`Sent payment failure notification for ${type} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment failure notification:`, error);
    }
  }

  /**
   * Generate payment link for invoice
   */
  private generatePaymentLink(invoice: SubscriptionInvoice): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'https://clinic.example.com';
    return `${baseUrl}/billing/pay/${invoice.id}?token=${this.generateSecureToken(invoice.id)}`;
  }

  /**
   * Generate payment link for client payment
   */
  private generateClientPaymentLink(payment: ClientCoachPayment): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'https://clinic.example.com';
    return `${baseUrl}/payment/${payment.id}?token=${this.generateSecureToken(payment.id)}`;
  }

  /**
   * Generate secure token for payment links
   */
  private generateSecureToken(entityId: string): string {
    // In production, use proper JWT or encrypted token
    return Buffer.from(`${entityId}:${Date.now()}`).toString('base64');
  }

  /**
   * Get subscription reminder email template
   */
  private getSubscriptionReminderTemplate(
    reminder: PaymentReminder,
    invoice: SubscriptionInvoice
  ): NotificationTemplate {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

    const subjects: Record<string, string> = {
      first: 'תזכורת תשלום - החשבון שלך מגיע בעוד שבועיים',
      second: 'תזכורת תשלום - החשבון שלך מגיע בעוד שבוע',
      final: 'תזכורת אחרונה - החשבון שלך מגיע בעוד 3 ימים',
      overdue: 'חשבון באיחור - נדרש תשלום מיידי',
    };

    const bodies: Record<string, string> = {
      first: `
שלום,

זוהי תזכורת ידידותית שהחשבון שלך עבור ${invoice.subscription.plan.name} מגיע לתשלום בעוד שבועיים.

פרטי החשבון:
• מספר חשבון: ${invoice.invoiceNumber}
• סכום: ${formatCurrency(reminder.amount)}
• תאריך פירעון: ${reminder.dueDate.toLocaleDateString('he-IL')}

לתשלום מיידי: ${reminder.paymentLink}

תודה,
צוות הקליניקה
      `,
      second: `
שלום,

זוהי תזכורת ידידותית שהחשבון שלך עבור ${invoice.subscription.plan.name} מגיע לתשלום בעוד שבוע.

פרטי החשבון:
• מספר חשבון: ${invoice.invoiceNumber}
• סכום: ${formatCurrency(reminder.amount)}
• תאריך פירעון: ${reminder.dueDate.toLocaleDateString('he-IL')}

לתשלום מיידי: ${reminder.paymentLink}

תודה,
צוות הקליניקה
      `,
      final: `
שלום,

זוהי התזכורת האחרונה שהחשבון שלך מגיע לתשלום בעוד 3 ימים.

פרטי החשבון:
• מספר חשבון: ${invoice.invoiceNumber}
• סכום: ${formatCurrency(reminder.amount)}
• תאריך פירעון: ${reminder.dueDate.toLocaleDateString('he-IL')}

לתשלום מיידי: ${reminder.paymentLink}

*אי תשלום עד התאריך עלול לגרום להשעיה זמנית של השירות

תודה,
צוות הקליניקה
      `,
      overdue: `
שלום,

החשבון שלך באיחור ונדרש תשלום מיידי כדי למנוע השעיה של השירות.

פרטי החשבון:
• מספר חשבון: ${invoice.invoiceNumber}
• סכום: ${formatCurrency(reminder.amount)}
• תאריך פירעון: ${reminder.dueDate.toLocaleDateString('he-IL')} (באיחור)

לתשלום מיידי: ${reminder.paymentLink}

אנא צור קשר אם יש בעיה בתשלום.

תודה,
צוות הקליניקה
      `,
    };

    return {
      type: 'email',
      subject: subjects[reminder.reminderType],
      body: bodies[reminder.reminderType],
      variables: {
        amount: formatCurrency(reminder.amount),
        dueDate: reminder.dueDate.toLocaleDateString('he-IL'),
        invoiceNumber: reminder.invoiceNumber || '',
        paymentLink: reminder.paymentLink || '',
      },
    };
  }

  /**
   * Get client payment reminder template
   */
  private getClientPaymentReminderTemplate(
    reminder: PaymentReminder,
    payment: ClientCoachPayment
  ): NotificationTemplate {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

    return {
      type: 'email',
      subject: 'תזכורת תשלום - בקשת תשלום ממתינה',
      body: `
שלום,

יש לך בקשת תשלום ממתינה עבור ${payment.description}.

פרטי התשלום:
• סכום: ${formatCurrency(payment.amountNis)}
• סוג תשלום: ${this.getPaymentTypeHebrew(payment.paymentType)}
• תאריך: ${payment.createdAt.toLocaleDateString('he-IL')}

לתשלום מיידי: ${reminder.paymentLink}

תודה,
המטפל שלך
      `,
      variables: {
        amount: formatCurrency(reminder.amount),
        paymentType: this.getPaymentTypeHebrew(payment.paymentType),
        paymentLink: reminder.paymentLink || '',
      },
    };
  }

  /**
   * Get payment success template
   */
  private getPaymentSuccessTemplate(
    type: 'subscription' | 'client_payment',
    amount: number,
    currency: string
  ): NotificationTemplate {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('he-IL', { style: 'currency', currency }).format(amount);

    const subjects = {
      subscription: 'תשלום התקבל בהצלחה - מנוי פעיל',
      client_payment: 'תשלום התקבל בהצלחה',
    };

    const bodies = {
      subscription: `
שלום,

תשלום המנוי שלך התקבל בהצלחה!

• סכום: ${formatCurrency(amount)}
• תאריך: ${new Date().toLocaleDateString('he-IL')}

המנוי שלך פעיל וכל השירותים זמינים.

תודה,
צוות הקליניקה
      `,
      client_payment: `
שלום,

התשלום שלך התקבל בהצלחה!

• סכום: ${formatCurrency(amount)}
• תאריך: ${new Date().toLocaleDateString('he-IL')}

קבלה תישלח אליך בנפרד.

תודה,
המטפל שלך
      `,
    };

    return {
      type: 'email',
      subject: subjects[type],
      body: bodies[type],
      variables: {
        amount: formatCurrency(amount),
        date: new Date().toLocaleDateString('he-IL'),
      },
    };
  }

  /**
   * Get payment failure template
   */
  private getPaymentFailureTemplate(
    _type: 'subscription' | 'client_payment',
    amount: number,
    reason: string,
    currency: string
  ): NotificationTemplate {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('he-IL', { style: 'currency', currency }).format(amount);

    return {
      type: 'email',
      subject: 'תשלום נכשל - נדרשת פעולה',
      body: `
שלום,

התשלום שלך נכשל והוא דורש תשומת לב.

• סכום: ${formatCurrency(amount)}
• סיבת הכשל: ${reason}
• תאריך: ${new Date().toLocaleDateString('he-IL')}

אנא נסה שוב או צור קשר לטיפול בבעיה.

תודה,
צוות הקליניקה
      `,
      variables: {
        amount: formatCurrency(amount),
        reason,
        date: new Date().toLocaleDateString('he-IL'),
      },
    };
  }

  /**
   * Get SMS reminder text
   */
  private getSMSReminderText(reminder: PaymentReminder): string {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('he-IL', { style: 'currency', currency: reminder.currency }).format(amount);

    if (reminder.reminderType === 'overdue') {
      return `חשבון באיחור: ${formatCurrency(reminder.amount)}. תשלום מיידי: ${reminder.paymentLink}`;
    } else {
      return `תזכורת תשלום: ${formatCurrency(reminder.amount)} מגיע ב-${reminder.dueDate.toLocaleDateString('he-IL')}. ${reminder.paymentLink}`;
    }
  }

  /**
   * Get suspension notification body
   */
  private getSuspensionNotificationBody(subscription: CoachSubscription): string {
    return `
שלום,

השירות שלך הושעה זמנית עקב אי תשלום חשבון.

פרטי המנוי:
• תוכנית: ${subscription.plan.name}
• תאריך השעיה: ${new Date().toLocaleDateString('he-IL')}

לחידוש השירות, אנא סדר את התשלום הממתין ביותר מהר האפשר.

לסיוע: support@clinic.example.com

תודה,
צוות הקליניקה
    `;
  }

  /**
   * Get payment type in Hebrew
   */
  private getPaymentTypeHebrew(type: string): string {
    const types: Record<string, string> = {
      session: 'טיפול בודד',
      package: 'חבילת טיפולים',
      subscription: 'מנוי חודשי',
    };
    return types[type] || type;
  }

  /**
   * Send notification via email/SMS/push
   */
  private async sendNotification(notification: {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject: string;
    body: string;
    variables: Record<string, string>;
  }): Promise<void> {
    try {
      if (notification.type === 'email') {
        await this.sendEmail(notification.recipient, notification.subject, notification.body);
      } else if (notification.type === 'sms') {
        await this.sendSMS(notification.recipient, notification.body);
      }
    } catch (error) {
      this.logger.error(`Failed to send ${notification.type} notification:`, error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    
    // Mock implementation for development
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`[EMAIL BODY]\n${body}`);
      return;
    }

    // Production email sending would go here
    // await this.emailService.send({ to, subject, html: body });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`[SMS] To: ${to}, Message: ${message}`);
    
    // Mock implementation for development
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }

    // Production SMS sending would go here
    // await this.smsService.send({ to, message });
  }

  /**
   * Helper methods to get user data
   */
  private async getCoachEmail(coachId: string): Promise<string> {
    // In production, fetch from user service
    return `coach-${coachId}@example.com`;
  }

  private async getClientEmail(clientId: string): Promise<string> {
    // In production, fetch from user service
    return `client-${clientId}@example.com`;
  }

  private async getClientPhone(clientId: string): Promise<string> {
    // In production, fetch from user service
    return `050-${clientId.substring(0, 7)}`;
  }
}