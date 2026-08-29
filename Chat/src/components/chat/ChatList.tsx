import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MessageSquarePlus, Loader2, Edit3 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { FilterCategory } from '../../context/ChatContext';
import { ChatItem } from './ChatItem';
import { userService } from '../../services/user.service';
import { Avatar } from '../common/Avatar';
import type { User } from '../../types/chat.types';

export const ChatList: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    openModal,
    createNewChat,
    currentUser,
  } = useChat();

  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchedUsers([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    let isMounted = true;

    const timer = setTimeout(() => {
      userService
        .searchUsers(q)
        .then((users) => {
          if (isMounted) {
            setSearchedUsers(users);
            setIsSearching(false);
          }
        })
        .catch((err) => {
          console.error('User search API error:', err);
          if (isMounted) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredConversations = conversations.filter((c) => {
    // Only display conversations that have messages or are currently active
    if (!c.lastMessage && c.id !== activeConversationId) return false;

    if (filterCategory === 'archived') {
      if (!c.archived) return false;
    } else {
      if (c.archived) return false;
    }

    if (filterCategory === 'unread' && c.unreadCount === 0) return false;
    if (filterCategory === 'favorites' && !c.pinned) return false;
    if (filterCategory === 'groups' && c.type !== 'group') return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (c.type === 'group' && c.name?.toLowerCase().includes(query)) return true;
    if (c.lastMessage?.text.toLowerCase().includes(query)) return true;

    return c.participants.some((p) => p.name.toLowerCase().includes(query));
  });

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);
  const availableSearchedUsers = searchedUsers.filter((u) => {
    const myIdStr = String(currentUser.id).trim();
    const uIdStr = String(u.id).trim();
    if (myIdStr === uIdStr) return false;

    const myMatch = myIdStr.match(/\d+/);
    const uMatch = uIdStr.match(/\d+/);
    if (myMatch && uMatch && myMatch[0] === uMatch[0]) return false;

    if (currentUser.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase()) return false;
    return true;
  });

  const filterChips: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'favorites', label: 'Pinned' },
    { id: 'groups', label: 'Groups' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className="w-full md:w-80 lg:w-[350px] flex flex-col h-full bg-white dark:bg-[#111827] rounded-none md:rounded-2xl border-0 md:border border-slate-200/80 dark:border-white/10 shadow-none md:shadow-2xl flex-shrink-0 select-none relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Chats
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openModal('new_chat')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telegram-style Search Input Pill */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-full outline-hidden focus:ring-2 focus:ring-violet-500/40 focus:bg-white dark:focus:bg-slate-800 transition-all border border-transparent focus:border-violet-500/30"
          />
          {isSearching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
          )}
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterCategory(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterCategory === chip.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation & User Search List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 && availableSearchedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-slate-500 dark:text-slate-400">
            {isSearching ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-violet-500 animate-spin" />
                <p className="text-sm font-medium">Searching users...</p>
              </>
            ) : (
              <>
                <Filter className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                <p className="text-sm font-medium">No conversations or users found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Try searching by name, username, phone, or email.
                </p>
                <button
                  onClick={() => openModal('new_chat')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Start New Chat
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section Header */}
            {pinnedConversations.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Pinned
                </div>
                {pinnedConversations.map((c) => (
                  <ChatItem
                    key={c.id}
                    conversation={c}
                    isSelected={c.id === activeConversationId}
                    onClick={() => selectConversation(c.id)}
                  />
                ))}
              </div>
            )}

            {/* Standard Conversations */}
            {unpinnedConversations.length > 0 && (
              <div className="space-y-1">
                {pinnedConversations.length > 0 && (
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    All Chats
                  </div>
                )}
                {unpinnedConversations.map((c) => (
                  <ChatItem
                    key={c.id}
                    conversation={c}
                    isSelected={c.id === activeConversationId}
                    onClick={() => selectConversation(c.id)}
                  />
                ))}
              </div>
            )}

            {/* Search API User Results */}
            {searchQuery.trim() && availableSearchedUsers.length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider bg-violet-50/50 dark:bg-violet-950/30 rounded-lg flex items-center justify-between">
                  <span>Users Found ({availableSearchedUsers.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to chat</span>
                </div>
                {availableSearchedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => createNewChat(user)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Avatar src={user.avatar} name={user.name} size="md" status={user.status} showStatus />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.username ? `@${user.username}` : user.email || user.phone || user.about}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modern Floating Action Button (FAB) - Telegram Style */}
      <button
        onClick={() => openModal('new_chat')}
        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/35 hover:scale-105 active:scale-95 transition-all z-20"
        title="Compose New Message"
      >
        <Edit3 className="w-5 h-5" />
      </button>
    </div>
  );
};

