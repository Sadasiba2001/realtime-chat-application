import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Info,
  Pin,
  VolumeX,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../utils/date.utils';

interface ChatHeaderProps {
  onToggleSearch: () => void;
  onToggleInfo: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSearch,
  onToggleInfo,
}) => {
  const {
    activeConversation,
    currentUser,
    startCall,
    togglePin,
    toggleMute,
    isMobileView,
    backToChatListMobile,
  } = useChat();

  const { startCall: startVoiceCall } = useVoiceCall();

  const [showDropdown, setShowDropdown] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants.find((p) => p.id !== currentUser.id) ||
    activeConversation.participants[0];

  const displayName = isGroup
    ? activeConversation.name || 'Group DMs'
    : otherParticipant?.name || 'Unknown Contact';

  const displayAvatar = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;
  const userStatus = isGroup ? undefined : otherParticipant?.status;

  const statusSubtext = isGroup
    ? `${activeConversation.participants.length} members`
    : activeConversation.isTyping
      ? 'typing...'
      : otherParticipant?.status === 'online'
        ? 'Online'
        : formatLastSeen(otherParticipant?.lastSeen);

  return (
    <header className="h-16 px-4 md:px-5 flex items-center justify-between bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 z-20 select-none transition-colors">
      {/* Contact Info & Mobile Back Button */}
      <div className="flex items-center gap-3 min-w-0">
        {isMobileView && (
          <button
            onClick={backToChatListMobile}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 cursor-pointer group" onClick={onToggleInfo}>
          <Avatar
            src={displayAvatar}
            name={displayName}
            size="md"
            status={userStatus}
            showStatus={!isGroup}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                {displayName}
              </h3>
            </div>
            <p
              className={`text-xs truncate ${activeConversation.isTyping || otherParticipant?.status === 'online'
                  ? 'text-violet-600 dark:text-violet-400 font-semibold'
                  : 'text-slate-400 dark:text-slate-500'
                }`}
            >
              {statusSubtext}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {/* Voice Call */}
        {otherParticipant && (
          <button
            onClick={() => startVoiceCall(otherParticipant)}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all active:scale-95"
            title="Voice Call"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Video Call */}
        {otherParticipant && (
          <button
            onClick={() => startCall(otherParticipant, 'video')}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all active:scale-95"
            title="Video Call"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
        )}

        {/* In-Chat Search */}
        <button
          onClick={onToggleSearch}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all active:scale-95"
          title="Search in conversation"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Info Drawer Toggle */}
        <button
          onClick={onToggleInfo}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all active:scale-95"
          title="Contact Info"
        >
          <Info className="w-4.5 h-4.5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all active:scale-95"
            title="More Options"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a2234] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 text-sm z-50 animate-fade-in backdrop-blur-md">
              <button
                onClick={() => {
                  togglePin(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <Pin className="w-4 h-4" />
                {activeConversation.pinned ? 'Unpin Conversation' : 'Pin Conversation'}
              </button>
              <button
                onClick={() => {
                  toggleMute(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                {activeConversation.muted ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
              <button
                onClick={() => {
                  onToggleInfo();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 transition-colors"
              >
                <Info className="w-4 h-4" />
                View Contact Info
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

