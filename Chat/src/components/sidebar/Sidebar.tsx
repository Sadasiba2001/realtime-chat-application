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
    <>
    <aside className="hidden md:flex dark:md:hidden w-[72px] flex-col items-center bg-surface border-r border-line flex-shrink-0 z-30 select-none">
      <div className="h-16 w-full flex items-center justify-center border-b border-line">
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
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent [&>svg]:w-[18px] [&>svg]:h-[18px] ${isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] px-1 text-[10px] leading-4 font-semibold text-white text-center bg-accent rounded-full ring-2 ring-surface">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div ref={userMenuRef} className="relative w-full flex flex-col items-center gap-1.5 py-3 border-t border-line">
        {showUserMenu && (
          <div className="absolute bottom-3 left-full ml-2 w-52 bg-surface border border-line rounded-xl shadow-menu p-1.5 text-sm z-50 animate-fade-in">
            <div className="px-3 py-2 mb-1 border-b border-line">
              <p className="text-sm font-medium text-ink truncate">{currentUser.name}</p>
              <p className="text-xs text-ink-3 capitalize">{currentUser.status || 'online'}</p>
            </div>
            <button
              onClick={() => {
                openModal('profile');
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              <UserRound className="w-4 h-4 text-ink-2" />
              Profile
            </button>
            <button
              onClick={() => {
                toggleTheme();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-ink-2" /> : <Moon className="w-4 h-4 text-ink-2" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        <Tooltip content="Profile" position="right">
          <button
            onClick={() => openModal('profile')}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-accent"
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
          className={`w-10 h-7 flex items-center justify-center rounded-lg transition-colors ${showUserMenu ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:bg-surface-2 hover:text-ink'}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>

    <aside className="hidden dark:md:flex w-20 flex-col justify-between items-center py-4 bg-white dark:bg-[#171324] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl flex-shrink-0 z-30 select-none transition-all">
      {/* Top Section: Standalone Logo & Navigation */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Standalone App Logo */}
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
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
    </>
  );
};

