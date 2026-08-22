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
      icon: <MessageSquare className="w-5.5 h-5.5" />,
      badge: totalUnread,
    },
    {
      id: 'status',
      label: 'Status',
      icon: <CircleDashed className="w-5.5 h-5.5" />,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <Phone className="w-5.5 h-5.5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5.5 h-5.5" />,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-18 md:w-20 flex flex-col justify-between items-center py-5 bg-gray-100 dark:bg-[#0f172a] border-r border-gray-200 dark:border-gray-800/80 flex-shrink-0 z-30 select-none">
      {/* Top Section: Standalone Logo & Navigation */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Standalone App Logo */}
        <div className="w-16 h-16 flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
          <img src={appLogo} alt="SB Chat App Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`relative p-3.5 rounded-2xl transition-all duration-150 flex items-center justify-center ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {item.icon}

                  {/* Active Left Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-sky-500 rounded-r-full" />
                  )}

                  {/* Unread Badge */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-sky-500 rounded-full border-2 border-gray-100 dark:border-[#0f172a]">
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
            className="p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5.5 h-5.5 text-amber-400" /> : <Moon className="w-5.5 h-5.5 text-sky-600" />}
          </button>
        </Tooltip>

        {/* Profile Avatar */}
        <Tooltip content="Profile" position="right">
          <button onClick={() => openModal('profile')}>
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="lg"
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
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};
