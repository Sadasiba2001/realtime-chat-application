import React from 'react';
import { Pin, VolumeX, Check, CheckCheck } from 'lucide-react';
import type { Conversation } from '../../types/chat.types';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

interface ChatItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const { currentUser, togglePin, toggleMute } = useChat();

  const isGroup = conversation.type === 'group';
  const otherParticipant = isGroup
    ? null
    : conversation.participants.find((p) => p.id !== currentUser.id) || conversation.participants[0];

  const displayName = isGroup ? conversation.name || 'Group Chat' : otherParticipant?.name || 'Unknown Contact';
  const displayAvatar = isGroup ? conversation.groupAvatar : otherParticipant?.avatar;
  const userStatus = isGroup ? undefined : otherParticipant?.status;

  const lastMsg = conversation.lastMessage;
  const isOutgoing = lastMsg?.senderId === currentUser.id;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-100 dark:border-gray-800/40 select-none ${
        isSelected
          ? 'bg-sky-50/80 dark:bg-[#1e293b]/80 border-l-4 border-l-sky-500'
          : 'hover:bg-gray-100/70 dark:hover:bg-slate-800/60'
      }`}
    >
      {/* Avatar */}
      <Avatar
        src={displayAvatar}
        name={displayName}
        size="lg"
        status={userStatus}
        showStatus={!isGroup}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </h4>
          {lastMsg && (
            <span
              className={`text-xs flex-shrink-0 ${
                conversation.unreadCount > 0
                  ? 'text-sky-600 dark:text-sky-400 font-medium'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {lastMsg.timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Last Message Snippet */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {conversation.isTyping ? (
              <span className="text-sky-600 dark:text-sky-400 font-medium animate-pulse flex items-center gap-1">
                typing...
              </span>
            ) : lastMsg ? (
              <>
                {isOutgoing && (
                  <span className="inline-flex">
                    {lastMsg.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                    ) : lastMsg.status === 'delivered' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400" />
                    )}
                  </span>
                )}

                <span className="truncate">
                  {lastMsg.isDeleted ? <i>Message deleted</i> : lastMsg.text || 'Attachment'}
                </span>
              </>
            ) : (
              <span className="italic text-gray-400">No messages yet</span>
            )}
          </div>

          {/* Badges & Flags */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.muted && (
              <VolumeX className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            )}
            {conversation.pinned && (
              <Pin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 fill-current" />
            )}
            {conversation.unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold text-white bg-sky-500 rounded-full min-w-[18px] text-center shadow-xs">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs p-1 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(conversation.id);
          }}
          className="p-1 text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
          title={conversation.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(conversation.id);
          }}
          className="p-1 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400"
          title={conversation.muted ? 'Unmute' : 'Mute'}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
