import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Info,
  Pin,
  Archive,
  VolumeX,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useVideoCall } from '../../context/VideoCallContext';
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
    togglePin,
    toggleArchive,
    toggleMute,
    blockUser,
    unblockUser,
    openModal,
    isMobileView,
    backToChatListMobile,
  } = useChat();

  const { startCall: startVoiceCall } = useVoiceCall();
  const { startVideoCall } = useVideoCall();

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
    <header className="h-16 px-3 sm:px-4 md:px-5 flex items-center justify-between bg-surface dark:bg-g-bg2 border-b border-line dark:border-g-line z-20 select-none transition-colors">
      {/* Contact Info & Mobile Back Button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
        {isMobileView && (
          <button
            onClick={backToChatListMobile}
            className="p-1.5 sm:p-2 rounded-lg text-ink-2 dark:text-g-text2 hover:bg-surface-2 dark:hover:bg-g-hover transition-colors shrink-0 -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 flex-1 overflow-hidden" onClick={onToggleInfo}>
          <Avatar
            src={displayAvatar}
            name={displayName}
            size="md"
            status={userStatus}
            showStatus={!isGroup}
          />

          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-sm sm:text-base font-semibold text-ink dark:text-g-text group-hover:text-accent dark:group-hover:text-gold transition-colors truncate leading-tight">
              {displayName}
            </h3>
            <p
              className={`text-[11px] sm:text-xs truncate leading-normal ${activeConversation.isTyping
                  ? 'text-accent dark:text-gold font-medium'
                  : otherParticipant?.status === 'online'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-ink-3 dark:text-g-text3'
                }`}
            >
              {statusSubtext}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Pushed to Far Right (WhatsApp style spacing) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
        {/* Video Call */}
        {otherParticipant && (
          <button
            onClick={() => startVideoCall(otherParticipant)}
            className="p-2 text-ink-2 dark:text-g-text2 hover:text-ink dark:hover:text-gold hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-all cursor-pointer"
            title="Video Call"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Voice Call */}
        {otherParticipant && (
          <button
            onClick={() => startVoiceCall(otherParticipant)}
            className="p-2 text-ink-2 dark:text-g-text2 hover:text-ink dark:hover:text-gold hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-all cursor-pointer"
            title="Voice Call"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
        )}

        {/* In-Chat Search (Visible on sm+ screens) */}
        <button
          onClick={onToggleSearch}
          className="hidden sm:flex p-2 text-ink-2 dark:text-g-text2 hover:text-ink dark:hover:text-gold hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-all cursor-pointer"
          title="Search in conversation"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Info Drawer Toggle (Visible on md+ screens) */}
        <button
          onClick={onToggleInfo}
          className="hidden md:flex p-2 text-ink-2 dark:text-g-text2 hover:text-ink dark:hover:text-gold hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-all cursor-pointer"
          title="Contact Info"
        >
          <Info className="w-4.5 h-4.5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-ink-2 dark:text-g-text2 hover:text-ink dark:hover:text-gold hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-all cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-surface dark:bg-g-s2 border border-line dark:border-g-line rounded-xl shadow-menu dark:shadow-g py-1.5 text-sm z-50 animate-fade-in">
              <button
                onClick={() => {
                  onToggleSearch();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-ink dark:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover flex items-center gap-2 transition-colors sm:hidden"
              >
                <Search className="w-4 h-4" />
                Search in Chat
              </button>
              <button
                onClick={() => {
                  togglePin(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-ink dark:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover flex items-center gap-2 transition-colors"
              >
                <Pin className="w-4 h-4" />
                {activeConversation.pinned ? 'Unpin Conversation' : 'Pin Conversation'}
              </button>
              <button
                onClick={() => {
                  toggleArchive(activeConversation.id);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-ink dark:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover flex items-center gap-2 transition-colors"
              >
                <Archive className="w-4 h-4" />
                {activeConversation.archived ? 'Unarchive Conversation' : 'Archive Conversation'}
              </button>
              <button
                onClick={() => {
                  if (activeConversation.muted) {
                    toggleMute(activeConversation.id);
                  } else {
                    openModal('mute_chat', activeConversation);
                  }
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-ink dark:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover flex items-center gap-2 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                {activeConversation.muted ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
              <button
                onClick={() => {
                  onToggleInfo();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-ink dark:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover flex items-center gap-2 border-t border-line dark:border-g-line transition-colors"
              >
                <Info className="w-4 h-4" />
                View Contact Info
              </button>
              {!isGroup && (
                <>
                  <button
                    onClick={() => {
                      const partnerId = activeConversation.participantIds.find((pid) => pid !== currentUser.id) || activeConversation.id;
                      if (activeConversation.isBlocked) {
                        unblockUser(partnerId);
                      } else {
                        blockUser(partnerId);
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-danger dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors border-t border-line dark:border-g-line font-medium"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {activeConversation.isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                  <button
                    onClick={() => {
                      openModal('report_user', activeConversation);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors border-t border-line dark:border-g-line font-medium"
                  >
                    <Flag className="w-4 h-4" />
                    Report User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

