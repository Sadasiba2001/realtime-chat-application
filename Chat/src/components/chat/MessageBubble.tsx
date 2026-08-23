import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Star,
  Trash2,
  Reply,
  Smile,
  FileText,
  Download,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import type { Message, User } from '../../types/chat.types';
import { useChat } from '../../context/ChatContext';
import { EmojiPicker } from '../common/EmojiPicker';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  sender?: User;
  senderName?: string;
  showSenderName?: boolean;
  isGroup?: boolean;
  onReply?: () => void;
  isMatch?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  sender,
  senderName,
  showSenderName = false,
  isMatch = false,
}) => {
  const {
    deleteMessage,
    toggleStarMessage,
    addReaction,
    setReplyTo,
    openModal,
  } = useChat();

  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSelectReaction = (emoji: string) => {
    addReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const displayName = senderName || sender?.name;

  return (
    <div
      className={`group relative flex flex-col my-1 max-w-[85%] sm:max-w-[70%] select-none ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      } ${isMatch ? 'ring-2 ring-amber-400 rounded-2xl p-0.5' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Bubble Wrapper */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl shadow-xs border text-sm transition-all ${
          isOutgoing
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white rounded-tr-xs border-blue-500/30'
            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-tl-xs border-gray-200 dark:border-gray-700/80'
        }`}
      >
        {/* Group Chat Sender Name */}
        {showSenderName && displayName && !isOutgoing && (
          <p className="text-xs font-semibold text-sky-400 dark:text-sky-300 mb-1">
            {displayName}
          </p>
        )}

        {/* Reply Preview inside Bubble */}
        {message.replyTo && (
          <div
            className={`p-2 mb-2 rounded-lg text-xs border-l-3 ${
              isOutgoing
                ? 'bg-black/20 border-l-white/80 text-blue-100'
                : 'bg-gray-100 dark:bg-slate-900 border-l-sky-500 text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="font-bold block">{message.replyTo.senderName}</span>
            <p className="truncate opacity-90">{message.replyTo.text}</p>
          </div>
        )}

        {/* Text Content or Deleted Status */}
        {message.isDeleted ? (
          <p className="italic text-xs opacity-75">This message was deleted</p>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        )}

        {/* Attachments rendering */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((att) => (
              <div key={att.id}>
                {att.type === 'image' && (
                  <div
                    onClick={() => openModal('media_viewer', { url: att.url, name: att.name, type: 'image' })}
                    className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-black/10"
                  >
                    <img src={att.url} alt={att.name || 'Attachment'} className="max-h-60 w-full object-cover" />
                  </div>
                )}

                {att.type === 'document' && (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs ${
                      isOutgoing
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <FileText className="w-6 h-6 text-sky-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{att.name}</p>
                      <span className="opacity-75">{att.size}</span>
                    </div>
                    <Download className="w-4 h-4 opacity-75" />
                  </a>
                )}

                {att.type === 'location' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/10 text-xs">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="font-medium truncate">{att.locationName || 'Shared Location'}</span>
                  </div>
                )}

                {att.type === 'contact' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/10 text-xs">
                    <UserIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{att.contactName}</p>
                      <span className="opacity-80">{att.contactPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Timestamp & Read Status */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
          {message.isStarred && <Star className="w-3 h-3 text-amber-300 fill-current" />}
          <span>{message.timestamp}</span>
          {isOutgoing && (
            <span className="inline-flex">
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400 font-bold" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-white" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
            </span>
          )}
        </div>


        {/* Message Action Bar on Hover */}
        {showActions && !message.isDeleted && (
          <div
            className={`absolute top-2 ${
              isOutgoing ? '-left-28' : '-right-28'
            } flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-30 animate-fade-in`}
          >
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-gray-500 hover:text-amber-500 dark:text-gray-400"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                setReplyTo({
                  id: message.id,
                  senderName: displayName || (isOutgoing ? 'You' : 'Contact'),
                  text: message.text,
                })
              }
              className="p-1 text-gray-500 hover:text-sky-500 dark:text-gray-400"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleStarMessage(message.id)}
              className="p-1 text-gray-500 hover:text-amber-400 dark:text-gray-400"
              title="Star"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            {isOutgoing && (
              <button
                onClick={() => deleteMessage(message.id)}
                className="p-1 text-gray-500 hover:text-rose-500 dark:text-gray-400"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute z-50 bottom-full mb-2">
            <EmojiPicker onSelectEmoji={handleSelectReaction} />
          </div>
        )}
      </div>

      {/* Message Reactions Badge */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex items-center gap-1 -mt-2.5 z-10 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-xs">
          {message.reactions.map((r, i) => (
            <span key={i} title={r.userName}>
              {r.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
