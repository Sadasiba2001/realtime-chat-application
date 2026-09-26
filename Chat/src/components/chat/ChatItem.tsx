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
  const { currentUser, togglePin, toggleArchive, toggleMute, openModal } = useChat();

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
      className={`group relative flex items-center gap-3.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 select-none ${isSelected
          ? 'bg-accent-active text-ink dark:text-g-text dark:bg-gold/10'
          : 'hover:bg-surface-2 dark:hover:bg-g-s2 text-ink dark:text-g-text'
        }`}
    >
      {isSelected && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-accent dark:bg-gold" aria-hidden="true" />
      )}

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
            className={`text-sm font-semibold truncate ${isSelected ? 'text-ink dark:text-g-text' : 'text-ink dark:text-g-text'
              }`}
          >
            {displayName}
          </h4>
          {lastMsg && (
            <span
              className={`text-[11px] flex-shrink-0 font-medium ${isSelected
                  ? 'text-ink-2 dark:text-g-text/80'
                  : conversation.unreadCount > 0
                    ? 'text-accent dark:text-gold font-semibold'
                    : 'text-ink-3 dark:text-g-text3'
                }`}
            >
              {lastMsg.timestamp}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Last Message Snippet */}
          <div
            className={`flex items-center gap-1 text-xs truncate ${isSelected ? 'text-ink-2 dark:text-g-text/80' : 'text-ink-2 dark:text-g-text2'
              }`}
          >
            {conversation.isTyping ? (
              <span
                className={`font-semibold animate-pulse flex items-center gap-1 ${isSelected ? 'text-accent dark:text-g-text' : 'text-accent dark:text-gold'
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
                        className={`w-3.5 h-3.5 font-bold ${isSelected ? 'text-accent dark:text-g-text' : 'text-accent dark:text-gold'
                          }`}
                      />
                    ) : lastMsg.status === 'delivered' ? (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-ink-3 dark:text-g-text/80' : 'text-ink-3 dark:text-g-text3'
                          }`}
                      />
                    ) : (
                      <Check
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-ink-3 dark:text-g-text/80' : 'text-ink-3 dark:text-g-text3'
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
              <span className={isSelected ? 'italic text-ink-3 dark:text-g-text/80' : 'italic text-ink-3 dark:text-g-text2'}>
                No messages yet
              </span>
            )}
          </div>

          {/* Badges & Flags */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.muted && (
              <VolumeX
                className={`w-3.5 h-3.5 ${isSelected ? 'text-ink-3 dark:text-g-text/80' : 'text-ink-3 dark:text-g-text3'}`}
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
                  className={`w-3.5 h-3.5 fill-current ${isSelected ? 'text-accent dark:text-g-text' : 'text-accent dark:text-gold'
                    }`}
                />
              </button>
            )}
            {conversation.unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full min-w-[18px] text-center ${isSelected
                    ? 'bg-accent text-white dark:bg-g-deep dark:text-gold'
                    : 'bg-accent text-white dark:bg-gold dark:text-[#171717]'
                  }`}
              >
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-surface dark:bg-g-s2 p-1 rounded-lg shadow-menu dark:shadow-g border border-line dark:border-g-line z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(conversation.id);
          }}
          className="p-1 text-ink-2 hover:text-accent dark:text-g-text2 dark:hover:text-gold rounded-lg transition-colors"
          title={conversation.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleArchive(conversation.id);
          }}
          className="p-1 text-ink-2 hover:text-accent dark:text-g-text2 dark:hover:text-gold rounded-lg transition-colors"
          title={conversation.archived ? 'Unarchive' : 'Archive'}
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (conversation.muted) {
              toggleMute(conversation.id);
            } else {
              openModal('mute_chat', conversation);
            }
          }}
          className="p-1 text-ink-2 hover:text-warning dark:text-g-text2 dark:hover:text-amber-400 rounded-lg transition-colors"
          title={conversation.muted ? 'Unmute' : 'Mute'}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

