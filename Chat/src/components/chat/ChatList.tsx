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
    <div className="w-full md:w-80 lg:w-[350px] flex flex-col h-full bg-surface dark:bg-g-bg2 rounded-none border-0 border-r border-line dark:border-g-line shadow-none flex-shrink-0 select-none relative overflow-hidden transition-all">
      {/* Top Header with SB Logo */}
      <div className="p-3.5 sm:p-4 pb-2 border-b border-line dark:border-g-line">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink dark:text-g-text tracking-tight">
              Chats
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-ink-2 dark:text-g-text2">
            <button
              onClick={() => openModal('new_chat')}
              className="p-2 rounded-lg border border-line hover:bg-accent-soft hover:text-accent hover:border-accent-active dark:hover:bg-g-s2 dark:hover:text-g-text2 transition-colors dark:border-g-line dark:hover:border-gold/30"
              title="New Chat"
              aria-label="New Chat"
            >
              <MessageSquarePlus className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* WhatsApp-style Search Input Pill */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 dark:text-g-text2" />
          <input
            type="text"
            placeholder="Search chats or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-surface dark:bg-g-s2 text-ink dark:text-g-text placeholder-ink-3 dark:placeholder-g-text3 rounded-[10px] outline-hidden focus:ring-3 focus:ring-accent/10 dark:focus:ring-gold/10 focus:bg-surface dark:focus:bg-g-s2 transition-all border border-line dark:border-transparent focus:border-accent-2 dark:focus:border-gold/30"
          />
          {isSearching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent dark:text-gold animate-spin" />
          )}
        </div>

        {/* Filter Category Chips (WhatsApp style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterCategory(chip.id)}
              className={`px-3 py-1 rounded-md text-xs transition-all whitespace-nowrap ${filterCategory === chip.id
                  ? 'font-semibold bg-accent-soft text-accent dark:bg-gold/12 dark:text-gold border border-accent-active dark:border-gold/30'
                  : 'font-medium bg-surface dark:bg-g-s2 text-ink-2 dark:text-g-text2 hover:bg-surface-2 hover:text-ink dark:hover:bg-g-s3 dark:hover:text-g-text2 border border-line dark:border-g-line'
                }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation & User Search List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 pb-20 md:pb-4 space-y-1">
        {filteredConversations.length === 0 && availableSearchedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-ink-2 dark:text-g-text2">
            {isSearching ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-accent dark:text-gold animate-spin" />
                <p className="text-sm font-medium">Searching users...</p>
              </>
            ) : (
              <>
                <Filter className="w-10 h-10 mb-3 text-ink-3 dark:text-g-text4 stroke-[1.5]" />
                <p className="text-sm font-medium">No conversations or users found</p>
                <p className="text-xs text-ink-3 dark:text-g-text3 mt-1">
                  Try searching by name, username, phone, or email.
                </p>
                <button
                  onClick={() => openModal('new_chat')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-hover dark:bg-gold dark:hover:bg-gold-light rounded-lg transition-all flex items-center gap-1.5 dark:shadow-g active:scale-95 dark:text-[#171717]"
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
                <div className="px-3 py-1 text-[11px] font-semibold text-ink-3 dark:text-g-text3 uppercase tracking-wider">
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
                  <div className="px-3 py-1 text-[11px] font-semibold text-ink-3 dark:text-g-text3 uppercase tracking-wider">
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
                <div className="px-3 py-1.5 text-[11px] font-semibold text-accent dark:text-gold uppercase tracking-wider bg-transparent dark:bg-gold/12 rounded-lg flex items-center justify-between">
                  <span>Users Found ({availableSearchedUsers.length})</span>
                  <span className="text-[10px] text-ink-3 dark:text-g-text2 font-normal">Click to chat</span>
                </div>
                {availableSearchedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => createNewChat(user)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 dark:hover:bg-g-s2 cursor-pointer transition-all"
                  >
                    <Avatar src={user.avatar} name={user.name} size="md" status={user.status} showStatus />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-ink dark:text-g-text truncate">
                        {user.name}
                      </h4>
                      <p className="text-xs text-ink-2 dark:text-g-text2 truncate">
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

    </div>
  );
};

