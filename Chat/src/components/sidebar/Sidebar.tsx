import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  CircleDashed,
  Phone,
  Settings,
  Sun,
  Moon,
  LogOut,
  MoreHorizontal,
  UserRound,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import type { ActiveTab } from '../../types/chat.types';
import { Avatar } from '../common/Avatar';
import { Tooltip } from '../common/Tooltip';
import appLogo from '../../assets/logo.png';

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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
    <aside className="hidden md:flex w-[72px] flex-col items-center bg-surface dark:bg-g-deep border-r border-line dark:border-g-line2 flex-shrink-0 z-30 select-none">
      <div className="h-16 w-full flex items-center justify-center border-b border-line dark:border-g-line2">
        <img src={appLogo} alt="SB Chat" className="w-8 h-8 object-contain" />
      </div>

      <nav className="flex-1 flex flex-col items-center gap-2 py-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Tooltip key={item.id} content={item.label} position="right">
              <button
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent dark:focus-visible:outline-gold [&>svg]:w-[18px] [&>svg]:h-[18px] ${isActive
                  ? 'bg-accent-soft text-accent dark:bg-gold/14 dark:text-gold'
                  : 'text-ink-2 hover:bg-surface-2 hover:text-ink dark:text-g-text2 dark:hover:bg-g-hover dark:hover:text-g-text'
                  }`}
              >
                {isActive && (
                  <span className="hidden dark:block absolute -left-4 top-2 bottom-2 w-0.5 rounded-r-full bg-gold" aria-hidden="true" />
                )}
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] px-1 text-[10px] leading-4 font-semibold text-white text-center bg-accent rounded-full ring-2 ring-surface dark:bg-gold dark:ring-g-deep dark:text-[#171717]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div ref={userMenuRef} className="relative w-full flex flex-col items-center gap-1.5 py-3 border-t border-line dark:border-g-line2">
        {showUserMenu && (
          <div className="absolute bottom-3 left-full ml-2 w-52 bg-surface border border-line rounded-xl shadow-menu p-1.5 text-sm z-50 animate-fade-in dark:bg-g-s2 dark:border-g-line dark:shadow-g">
            <div className="px-3 py-2 mb-1 border-b border-line dark:border-g-line">
              <p className="text-sm font-medium text-ink truncate dark:text-g-text">{currentUser.name}</p>
              <p className="text-xs text-ink-3 capitalize dark:text-g-text3">{currentUser.status || 'online'}</p>
            </div>
            <button
              onClick={() => {
                openModal('profile');
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors dark:text-g-text dark:hover:bg-g-hover"
            >
              <UserRound className="w-4 h-4 text-ink-2 dark:text-g-text2" />
              Profile
            </button>
            <button
              onClick={() => {
                toggleTheme();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors dark:text-g-text dark:hover:bg-g-hover"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-ink-2 dark:text-g-text2" /> : <Moon className="w-4 h-4 text-ink-2 dark:text-g-text2" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="my-1 h-px bg-line dark:bg-g-line" />
            <button
              onClick={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger hover:bg-red-50 transition-colors dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        <Tooltip content="Profile" position="right">
          <button
            onClick={() => openModal('profile')}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-accent dark:focus-visible:outline-gold"
            aria-label="Open profile"
          >
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="sm"
              status={currentUser.status}
              showStatus
            />
          </button>
        </Tooltip>
        <button
          onClick={() => setShowUserMenu((prev) => !prev)}
          aria-label="Account menu"
          aria-expanded={showUserMenu}
          className={`w-10 h-7 flex items-center justify-center rounded-lg transition-colors ${showUserMenu ? 'bg-surface-2 text-ink dark:bg-g-s2 dark:text-g-text' : 'text-ink-3 hover:bg-surface-2 hover:text-ink dark:text-g-text3 dark:hover:bg-g-hover dark:hover:text-g-text'}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

