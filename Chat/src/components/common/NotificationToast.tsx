import React, { useEffect } from 'react';
import { Bell, X, MessageSquare, Heart, PhoneCall, Video } from 'lucide-react';

export interface ToastNotificationData {
  id: string;
  type: 'new_message' | 'reaction' | 'reply' | 'group_event' | 'incoming_call';
  title: string;
  body: string;
  avatar?: string;
  conversationId?: string;
}

interface NotificationToastProps {
  notification: ToastNotificationData | null;
  onClose: () => void;
  onClickNotification?: (conversationId?: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClickNotification,
}) => {
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'incoming_call':
        return <PhoneCall className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'group_event':
        return <Bell className="w-4 h-4 text-amber-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-accent dark:text-gold" />;
    }
  };

  const handleClick = () => {
    if (onClickNotification) {
      onClickNotification(notification.conversationId);
    }
    onClose();
  };

  return (
    <div className="fixed top-5 right-5 z-50 animate-bounce-in max-w-sm w-full">
      <div
        onClick={handleClick}
        className="flex items-center gap-3 p-3.5 bg-surface dark:bg-g-s2 rounded-xl shadow-menu border border-line dark:border-g-line cursor-pointer hover:border-accent-2 transition-all group dark:shadow-g dark:hover:border-gold/30"
      >
        <div className="relative flex-shrink-0">
          <img
            src={notification.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.title)}`}
            alt={notification.title}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-10 h-10 rounded-full object-cover border border-line dark:border-g-line"
          />
          <div className="absolute -bottom-1 -right-1 p-1 bg-surface dark:bg-g-s1 rounded-full shadow-xs border border-line dark:border-g-line">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-ink dark:text-g-text truncate group-hover:text-accent dark:group-hover:text-gold transition-colors">
              {notification.title}
            </h4>
            <span className="text-[10px] text-accent font-semibold uppercase tracking-wider dark:text-gold">
              {notification.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-ink-2 dark:text-g-text2 truncate mt-0.5">{notification.body}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 text-ink-3 hover:text-ink dark:hover:text-g-text rounded-full hover:bg-surface-2 dark:hover:bg-g-hover transition-colors flex-shrink-0 dark:text-g-text2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
