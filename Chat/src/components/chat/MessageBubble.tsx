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
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const handleSelectReaction = (emoji: string) => {
    addReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const displayName = senderName || sender?.name;

  return (
    <div
      className={`group relative flex flex-col my-1 max-w-[85%] sm:max-w-[70%] select-none ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      } ${isMatch ? 'ring-2 ring-violet-400 rounded-2xl p-0.5' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
        setShowDeleteMenu(false);
      }}
    >
      {/* Bubble Wrapper */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl text-sm transition-all duration-150 ${
          isOutgoing
            ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-md shadow-indigo-500/15 border border-violet-400/20'
            : 'bg-white dark:bg-[#1a2234] text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-white/10 shadow-xs'
        }`}
      >
        {/* Group Chat Sender Name */}
        {showSenderName && displayName && !isOutgoing && (
          <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">
            {displayName}
          </p>
        )}

        {/* Reply Preview inside Bubble */}
        {message.replyTo && (
          <div
            className={`p-2 mb-2 rounded-xl text-xs border-l-3 ${
              isOutgoing
                ? 'bg-black/20 border-l-white/90 text-violet-100'
                : 'bg-slate-100 dark:bg-[#111827] border-l-violet-500 text-slate-700 dark:text-slate-300'
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
                    className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border border-black/10 shadow-xs"
                  >
                    <img src={att.url} alt={att.name || 'Attachment'} className="max-h-60 w-full object-cover" />
                  </div>
                )}

                {att.type === 'document' && (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-colors ${
                      isOutgoing
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                        : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-6 h-6 text-violet-400 flex-shrink-0" />
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
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-80">
          {message.isStarred && <Star className="w-3 h-3 text-amber-300 fill-current" />}
          <span>{message.timestamp}</span>
          {isOutgoing && (
            <span className="inline-flex">
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-300 font-bold" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/90" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/90" />
              )}
            </span>
          )}
        </div>

        {/* Message Action Bar on Hover */}
        {showActions && !message.isDeleted && (
          <div
            className={`absolute top-1 ${
              isOutgoing ? '-left-28' : '-right-28'
            } flex items-center gap-0.5 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md p-1 rounded-full shadow-xl border border-slate-200 dark:border-white/10 z-30 animate-fade-in`}
          >
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowDeleteMenu(false);
              }}
              className="p-1 text-slate-500 hover:text-amber-500 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
              className="p-1 text-slate-500 hover:text-violet-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleStarMessage(message.id)}
              className="p-1 text-slate-500 hover:text-amber-400 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Star"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowDeleteMenu((prev) => !prev);
                  setShowEmojiPicker(false);
                }}
                className="p-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {showDeleteMenu && (
                <div
                  className={`absolute z-50 bottom-full mb-2 ${
                    isOutgoing ? 'right-0' : 'left-0'
                  } w-44 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 px-1 animate-fade-in text-xs whitespace-nowrap`}
                >
                  <button
                    onClick={() => {
                      deleteMessage(message.id, 'me');
                      setShowDeleteMenu(false);
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Delete for me</span>
                  </button>

                  {isOutgoing && (
                    <button
                      onClick={() => {
                        deleteMessage(message.id, 'everyone');
                        setShowDeleteMenu(false);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete for everyone</span>
                    </button>
                  )}
                </div>
              )}
            </div>
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
        <div className="flex items-center gap-1 -mt-2.5 z-10 px-2.5 py-0.5 bg-white dark:bg-[#1a2234] rounded-full shadow-md border border-slate-200 dark:border-white/10 text-xs">
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

