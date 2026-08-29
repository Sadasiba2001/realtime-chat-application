import React from 'react';
import { Pin, Archive, VolumeX, Check, CheckCheck } from 'lucide-react';
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
  const { currentUser, togglePin, toggleArchive, toggleMute } = useChat();

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
      onContextMenu={(e) => {
        e.preventDefault();
        togglePin(conversation.id);
      }}
      className={`group relative flex items-center gap-3.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 select-none ${isSelected
          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
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
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4
            className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
              }`}
          >
            {displayName}
          </h4>
          {lastMsg && (
            <span
              className={`text-[11px] flex-shrink-0 font-medium ${isSelected
                  ? 'text-white/80'
                  : conversation.unreadCount > 0
                    ? 'text-violet-600 dark:text-violet-400 font-semibold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
            >
              {lastMsg.timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Last Message Snippet */}
          <div
            className={`flex items-center gap-1 text-xs truncate ${isSelected ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
              }`}
          >
            {conversation.isTyping ? (
              <span
                className={`font-semibold animate-pulse flex items-center gap-1 ${isSelected ? 'text-white' : 'text-violet-600 dark:text-violet-400'
                  }`}
              >
                typing...
              </span>
            ) : lastMsg ? (
              <>
                {isOutgoing && (
                  <span className="inline-flex flex-shrink-0">
                    {lastMsg.status === 'read' ? (
                      <CheckCheck
                        className={`w-3.5 h-3.5 font-bold ${isSelected ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'
                          }`}
                      />
                    ) : lastMsg.status === 'delivered' ? (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                          }`}
                      />
                    ) : (
                      <Check
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                          }`}
                      />
                    )}
                  </span>
                )}

                <span className="truncate">
                  {lastMsg.isDeleted ? <i>Message deleted</i> : lastMsg.text || 'Attachment'}
                </span>
              </>
            ) : (
              <span className={isSelected ? 'italic text-white/70' : 'italic text-slate-400'}>
                No messages yet
              </span>
            )}
          </div>

          {/* Badges & Flags */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.muted && (
              <VolumeX
                className={`w-3.5 h-3.5 ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}
              />
            )}
            {conversation.pinned && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(conversation.id);
                }}
                className="hover:scale-110 transition-transform"
                title="Unpin conversation"
              >
                <Pin
                  className={`w-3.5 h-3.5 fill-current ${isSelected ? 'text-white' : 'text-violet-600 dark:text-violet-400'
                    }`}
                />
              </button>
            )}
            {conversation.unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[18px] text-center shadow-xs ${isSelected
                    ? 'bg-white text-violet-700'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  }`}
              >
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs p-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(conversation.id);
          }}
          className="p-1 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 rounded-lg transition-colors"
          title={conversation.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleArchive(conversation.id);
          }}
          className="p-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg transition-colors"
          title={conversation.archived ? 'Unarchive' : 'Archive'}
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(conversation.id);
          }}
          className="p-1 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg transition-colors"
          title={conversation.muted ? 'Unmute' : 'Mute'}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

