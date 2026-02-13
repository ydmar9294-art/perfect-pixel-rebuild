/**
 * Push Notification Service - Web-only implementation
 * Uses the Web Notifications API (no Capacitor dependency)
 */

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class PushNotificationService {
  private isInitialized = false;
  private webNotificationPermission: NotificationPermission = 'default';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!('Notification' in window)) {
      this.isInitialized = true;
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      this.webNotificationPermission = permission;
    } catch (error) {
      // Silently fail - notifications are optional
    }

    this.isInitialized = true;
  }

  async showLocalNotification(notification: NotificationData): Promise<void> {
    if (!('Notification' in window) || this.webNotificationPermission !== 'granted') {
      return;
    }

    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: `notif-${Date.now()}`,
        requireInteraction: false
      });
    } catch (error) {
      // Silently fail
    }
  }

  getDeviceToken(): string | null {
    return null;
  }

  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'اختبار الإشعارات',
      body: 'تم تفعيل الإشعارات بنجاح! 🎉',
      data: { type: 'test' }
    });
  }

  getWebPermissionStatus(): NotificationPermission {
    return this.webNotificationPermission;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }
}

export const pushNotificationService = new PushNotificationService();
