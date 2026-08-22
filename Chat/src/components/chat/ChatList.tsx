import React from 'react';
import { Search, Plus, Filter, MessageSquarePlus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { FilterCategory } from '../../context/ChatContext';
import { ChatItem } from './ChatItem';

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
  } = useChat();

  const filteredConversations = conversations.filter((c) => {
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

  const filterChips: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'favorites', label: 'Pinned' },
    { id: 'groups', label: 'Groups' },
  ];

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-gray-800/80 flex-shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Chats
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openModal('new_chat')}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-slate-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl outline-hidden focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterCategory(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filterCategory === chip.id
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-900/30">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-gray-500 dark:text-gray-400">
            <Filter className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Try searching with another term or start a new chat.
            </p>
            <button
              onClick={() => openModal('new_chat')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" /> Start New Chat
            </button>
          </div>
        ) : (
          <>
            {/* Pinned Section Header */}
            {pinnedConversations.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70 dark:bg-[#0f172a]">
                  Pinned Conversations
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
              <div>
                {pinnedConversations.length > 0 && (
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70 dark:bg-[#0f172a]">
                    All Messages
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
          </>
        )}
      </div>
    </div>
  );
};
