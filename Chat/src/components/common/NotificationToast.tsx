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
        return <MessageSquare className="w-4 h-4 text-accent dark:text-indigo-500" />;
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
        className="flex items-center gap-3 p-3.5 bg-surface dark:bg-[#1a2234]/95 rounded-xl shadow-menu border border-line dark:border-white/10 cursor-pointer hover:border-accent-2 transition-all group dark:backdrop-blur-md dark:rounded-2xl dark:shadow-2xl dark:hover:border-indigo-500/50"
      >
        <div className="relative flex-shrink-0">
          <img
            src={notification.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.title)}`}
            alt={notification.title}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-10 h-10 rounded-full object-cover border border-line dark:border-white/10"
          />
          <div className="absolute -bottom-1 -right-1 p-1 bg-surface dark:bg-slate-900 rounded-full shadow-xs border border-line dark:border-slate-800">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-ink dark:text-slate-100 truncate group-hover:text-accent dark:group-hover:text-indigo-400 transition-colors">
              {notification.title}
            </h4>
            <span className="text-[10px] text-accent font-semibold uppercase tracking-wider dark:text-indigo-500">
              {notification.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-ink-2 dark:text-slate-300 truncate mt-0.5">{notification.body}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 text-ink-3 hover:text-ink dark:hover:text-slate-200 rounded-full hover:bg-surface-2 dark:hover:bg-slate-800 transition-colors flex-shrink-0 dark:text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
