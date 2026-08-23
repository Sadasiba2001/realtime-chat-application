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
    <header className="h-16 px-4 flex items-center justify-between bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800/80 z-20 select-none shadow-xs">
      {/* Contact Info & Mobile Back Button */}
      <div className="flex items-center gap-3 min-w-0">
        {isMobileView && (
          <button
            onClick={backToChatListMobile}
            className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 cursor-pointer" onClick={onToggleInfo}>
          <Avatar
            src={displayAvatar}
            name={displayName}
            size="md"
            status={userStatus}
            showStatus={!isGroup}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </h3>
            </div>
            <p
              className={`text-xs truncate ${
                activeConversation.isTyping || otherParticipant?.status === 'online'
                  ? 'text-sky-600 dark:text-sky-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {statusSubtext}
            </p>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Voice Call */}
        {otherParticipant && (
          <button
            onClick={() => startCall(otherParticipant, 'audio')}
            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        )}

        {/* Video Call */}
        {otherParticipant && (
          <button
            onClick={() => startCall(otherParticipant, 'video')}
            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
        )}

        {/* In-Chat Search */}
        <button
          onClick={onToggleSearch}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Info Drawer Toggle */}
        <button
          onClick={onToggleInfo}
          className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Contact Info"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1.5 text-sm z-50 animate-fade-in">
              <button
                onClick={() => {
                  togglePin(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Pin className="w-4 h-4" />
                {activeConversation.pinned ? 'Unpin Conversation' : 'Pin Conversation'}
              </button>
              <button
                onClick={() => {
                  toggleMute(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <VolumeX className="w-4 h-4" />
                {activeConversation.muted ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
              <button
                onClick={() => {
                  onToggleInfo();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
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
