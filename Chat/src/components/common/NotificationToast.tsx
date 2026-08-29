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
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
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
        className="flex items-center gap-3 p-3.5 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-indigo-500/50 transition-all group"
      >
        <div className="relative flex-shrink-0">
          <img
            src={notification.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.title)}`}
            alt={notification.title}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
          />
          <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full shadow-xs border border-slate-100 dark:border-slate-800">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {notification.title}
            </h4>
            <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
              {notification.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">{notification.body}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
