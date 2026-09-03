import React from 'react';
import { MessageSquare, CircleDashed, Phone, User as UserIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { ActiveTab } from '../../types/chat.types';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openModal, conversations } = useChat();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const tabs: { id: ActiveTab | 'profile'; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: totalUnread,
    },
    {
      id: 'status',
      label: 'Updates',
      icon: <CircleDashed className="w-5 h-5" />,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'You',
      icon: <UserIcon className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around z-40 select-none px-2 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'profile') {
                openModal('profile');
              } else {
                setActiveTab(tab.id as ActiveTab);
              }
            }}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer group"
          >
            <div className="relative">
              <div
                className={`px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                {tab.icon}
              </div>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-full shadow-xs">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              ) : null}
            </div>
            <span
              className={`text-[11px] mt-0.5 transition-colors ${
                isActive
                  ? 'font-bold text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
