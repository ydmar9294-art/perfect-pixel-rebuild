import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class PushNotificationService {
  private isInitialized = false;
  private deviceToken: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Listen for registration success
        PushNotifications.addListener('registration', (token: Token) => {
          this.deviceToken = token.value;
          console.log('Push registration success, token: ' + token.value);
          // Here you would typically send the token to your server
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
        });

        // Listen for push notifications received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          // Show local notification when in foreground
          this.showLocalNotification({
            title: notification.title || 'إشعار جديد',
            body: notification.body || '',
            data: notification.data
          });
        });

        // Listen for notification action (when user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('Push notification action performed:', action);
          // Handle navigation or action based on notification data
          this.handleNotificationAction(action.notification.data);
        });

        // Initialize local notifications for background/killed state
        await this.initializeLocalNotifications();
        
        this.isInitialized = true;
        console.log('Push notification service initialized');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async initializeLocalNotifications(): Promise<void> {
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      
      if (permStatus.display === 'granted') {
        // Listen for local notification actions
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          console.log('Local notification action:', action);
          this.handleNotificationAction(action.notification.extra);
        });
      }
    } catch (error) {
      console.error('Error initializing local notifications:', error);
    }
  }

  async showLocalNotification(notification: NotificationData): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // For web, use browser notifications if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.png'
        });
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'beep.wav',
            extra: notification.data
          }
        ]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  private handleNotificationAction(data: any): void {
    // Handle different notification types
    if (data?.type === 'low_stock') {
      // Navigate to inventory
      window.location.href = '/inventory';
    } else if (data?.type === 'overdue_invoice') {
      // Navigate to debts
      window.location.href = '/debts';
    } else if (data?.type === 'new_sale') {
      // Navigate to sales
      window.location.href = '/sales';
    }
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'اختبار الإشعارات',
      body: 'تم تفعيل الإشعارات بنجاح!',
      data: { type: 'test' }
    });
  }
}

export const pushNotificationService = new PushNotificationService();
