import React from 'react';
import {
  MessageSquare,
  CircleDashed,
  Phone,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import type { ActiveTab } from '../../types/chat.types';
import { Avatar } from '../common/Avatar';
import { Tooltip } from '../common/Tooltip';
import appLogo from '../../assets/photo_6073207430587290090_y-removebg-preview.png';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    openModal,
    conversations,
  } = useChat();

  const { logout } = useAuth();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: totalUnread,
    },
    {
      id: 'status',
      label: 'Status',
      icon: <CircleDashed className="w-5 h-5" />,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-16 md:w-20 flex flex-col justify-between items-center py-4 bg-white dark:bg-[#111827] rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl flex-shrink-0 z-30 select-none transition-all">
      {/* Top Section: Standalone Logo & Navigation */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Standalone App Logo */}
        <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
          <img src={appLogo} alt="SB Chat App Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`relative p-3 rounded-2xl transition-all duration-200 flex items-center justify-center ${isActive
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 scale-105'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-100'
                    }`}
                >
                  {item.icon}

                  {/* Unread Badge */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-[#111827] shadow-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle, Profile & Logout */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Theme Toggle */}
        <Tooltip content={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} position="right">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </Tooltip>

        {/* Profile Avatar */}
        <Tooltip content="Profile" position="right">
          <button onClick={() => openModal('profile')} className="transition-transform hover:scale-105 active:scale-95">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="md"
              status={currentUser.status}
              showStatus
            />
          </button>
        </Tooltip>

        {/* Logout Action */}
        <Tooltip content="Logout to Sign In screen" position="right">
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

