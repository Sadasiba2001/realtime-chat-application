export interface BrowserNotificationOptions extends NotificationOptions {
  conversationId?: string;
}

export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getBrowserNotificationPermission = (): NotificationPermission => {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[BrowserNotification] Error requesting permission:', err);
    return Notification.permission;
  }
};

export const showBrowserPushNotification = (
  title: string,
  options?: BrowserNotificationOptions,
  onClick?: (conversationId?: string) => void
): Notification | null => {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      if (typeof window !== 'undefined') {
        window.focus();
      }
      if (onClick) {
        onClick(options?.conversationId);
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[BrowserNotification] Failed to create browser notification:', err);
    return null;
  }
};
