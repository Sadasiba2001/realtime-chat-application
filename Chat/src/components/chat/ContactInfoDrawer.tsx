import React from 'react';
import { X, Phone, Mail, Pin, VolumeX, ShieldAlert, ZoomIn, Flag } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../utils/date.utils';
import { SharedMediaSection } from './SharedMediaSection';

interface ContactInfoDrawerProps {
  onClose: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({ onClose }) => {
  const { activeConversation, currentUser, togglePin, toggleMute, blockUser, unblockUser, openModal } = useChat();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants.find((p) => p.id !== currentUser.id) ||
    activeConversation.participants[0];

  const name = isGroup ? activeConversation.name || 'Group Chat' : otherParticipant?.name || 'Contact';
  const avatar = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;

  const hasCustomAvatar =
    Boolean(avatar) &&
    typeof avatar === 'string' &&
    avatar.trim() !== '' &&
    !avatar.includes('images.unsplash.com');

  const handleOpenPhoto = () => {
    if (hasCustomAvatar && avatar) {
      openModal('media_viewer', { url: avatar, name: `${name} Profile Photo`, type: 'image' });
    }
  };

  return (
    <div className="w-80 h-full bg-surface dark:bg-[#111827] border-l border-line dark:border-white/10 flex flex-col z-30 animate-fade-in select-none max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:shadow-menu dark:max-lg:static dark:shadow-2xl dark:max-lg:shadow-2xl">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-line dark:border-slate-800/60 bg-surface dark:bg-[#111827]/90 dark:backdrop-blur-md">
        <h3 className="text-sm font-semibold dark:font-bold text-ink dark:text-slate-100">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-ink-3 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 rounded-lg dark:rounded-full hover:bg-surface-2 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close contact info"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={hasCustomAvatar ? handleOpenPhoto : undefined}
            className={`relative ${hasCustomAvatar ? 'group cursor-pointer' : ''}`}
            title={hasCustomAvatar ? 'Click to expand profile photo' : undefined}
          >
            <Avatar src={hasCustomAvatar ? avatar : ''} name={name} size="xl" />
            {hasCustomAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                <ZoomIn className="w-7 h-7" />
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold dark:font-bold text-ink dark:text-slate-100 mt-4 dark:mt-3">{name}</h2>
          {!isGroup && otherParticipant && (
            <p className={`dark:hidden text-xs font-medium mt-0.5 ${otherParticipant.status === 'online' ? 'text-emerald-600' : 'text-ink-3'}`}>
              {otherParticipant.status === 'online' ? 'Online' : formatLastSeen(otherParticipant.lastSeen)}
            </p>
          )}
          <p className="text-xs text-ink-2 dark:text-slate-400 mt-1 dark:mt-0.5">
            {isGroup ? `${activeConversation.participants.length} Participants` : otherParticipant?.phone}
          </p>
          {hasCustomAvatar && (
            <button
              onClick={handleOpenPhoto}
              className="mt-3 dark:mt-2 text-xs font-medium dark:font-semibold text-accent dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <ZoomIn className="w-3.5 h-3.5" /> View Photo Fullscreen
            </button>
          )}
        </div>

        {/* Bio / About */}
        {!isGroup && otherParticipant?.about && (
          <div className="p-0 dark:p-4 bg-transparent dark:bg-[#1a2234] rounded-none dark:rounded-2xl border-0 dark:border dark:border-white/5 dark:shadow-xs">
            <span className="text-[11px] font-semibold text-ink-3 dark:text-slate-500 uppercase tracking-wider block mb-1.5 dark:mb-1">
              About
            </span>
            <p className="text-sm text-ink dark:text-slate-200 leading-relaxed dark:leading-normal">{otherParticipant.about}</p>
          </div>
        )}

        {/* Group Description */}
        {isGroup && activeConversation.description && (
          <div className="p-0 dark:p-4 bg-transparent dark:bg-[#1a2234] rounded-none dark:rounded-2xl border-0 dark:border dark:border-white/5 dark:shadow-xs">
            <span className="text-[11px] font-semibold text-ink-3 dark:text-slate-500 uppercase tracking-wider block mb-1.5 dark:mb-1">
              Group Description
            </span>
            <p className="text-sm text-ink dark:text-slate-200 leading-relaxed dark:leading-normal">{activeConversation.description}</p>
          </div>
        )}

        {/* Contact Info Items */}
        {!isGroup && otherParticipant && (
          <div className="space-y-3 dark:space-y-2.5">
            <span className="dark:hidden text-[11px] font-semibold text-ink-3 uppercase tracking-wider block">
              Contact
            </span>
            <div className="flex items-center gap-3 p-0 dark:p-3 bg-transparent dark:bg-[#1a2234] rounded-none dark:rounded-2xl border-0 dark:border dark:border-white/5">
              <Phone className="w-4 h-4 text-ink-3 dark:text-violet-500" />
              <div>
                <p className="text-[11px] text-ink-3 dark:text-slate-400">Phone</p>
                <p className="text-sm dark:text-xs text-ink dark:text-slate-200 dark:font-medium">
                  {otherParticipant.phone || 'Not provided'}
                </p>
              </div>
            </div>

            {otherParticipant.email && (
              <div className="flex items-center gap-3 p-0 dark:p-3 bg-transparent dark:bg-[#1a2234] rounded-none dark:rounded-2xl border-0 dark:border dark:border-white/5">
                <Mail className="w-4 h-4 text-ink-3 dark:text-indigo-500" />
                <div>
                  <p className="text-[11px] text-ink-3 dark:text-slate-400">Email</p>
                  <p className="text-sm dark:text-xs text-ink dark:text-slate-200 dark:font-medium">{otherParticipant.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shared Media Section */}
        <SharedMediaSection targetUserId={activeConversation.id} />

        {/* Action Toggles */}
        <div className="space-y-2 pt-2 border-t border-line dark:border-slate-800/80">
          <button
            onClick={() => togglePin(activeConversation.id)}
            className="w-full flex items-center justify-between px-3 dark:px-4 py-2.5 dark:py-3 bg-transparent dark:bg-[#1a2234] hover:bg-surface-2 dark:hover:bg-slate-800/80 rounded-lg dark:rounded-2xl transition-colors text-sm text-ink dark:text-slate-200 border border-transparent dark:border-white/5"
          >
            <span className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-ink-2 dark:text-violet-500" /> Pin Chat
            </span>
            <span className="text-xs font-semibold dark:font-bold text-accent dark:text-violet-400">{activeConversation.pinned ? 'YES' : 'NO'}</span>
          </button>

          <button
            onClick={() => {
              if (activeConversation.muted) {
                toggleMute(activeConversation.id);
              } else {
                openModal('mute_chat', activeConversation);
              }
            }}
            className="w-full flex items-center justify-between px-3 dark:px-4 py-2.5 dark:py-3 bg-transparent dark:bg-[#1a2234] hover:bg-surface-2 dark:hover:bg-slate-800/80 rounded-lg dark:rounded-2xl transition-colors text-sm text-ink dark:text-slate-200 border border-transparent dark:border-white/5"
          >
            <span className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-ink-2 dark:text-amber-500" /> Mute Notifications
            </span>
            <span className="text-xs font-semibold dark:font-bold text-ink-3 dark:text-amber-500">{activeConversation.muted ? 'MUTED' : 'OFF'}</span>
          </button>

          {!isGroup && (
            <>
              <button
                onClick={() => {
                  const partnerId = otherParticipant?.id || activeConversation.id;
                  if (activeConversation.isBlocked) {
                    unblockUser(partnerId);
                  } else {
                    blockUser(partnerId);
                  }
                }}
                className="w-full flex items-center justify-between px-3 dark:px-4 py-2.5 dark:py-3 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg dark:rounded-2xl transition-colors text-sm text-danger dark:text-rose-400 font-medium dark:font-semibold border border-transparent dark:hover:border-rose-900/50"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> {activeConversation.isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </span>
                <span className="text-xs font-semibold dark:font-bold text-danger dark:text-rose-500">{activeConversation.isBlocked ? 'BLOCKED' : ''}</span>
              </button>

              <button
                onClick={() => {
                  openModal('report_user', activeConversation);
                }}
                className="w-full flex items-center gap-2 px-3 dark:px-4 py-2.5 dark:py-3 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg dark:rounded-2xl transition-colors text-sm text-amber-600 dark:text-amber-400 font-medium dark:font-semibold border border-transparent dark:hover:border-amber-900/50"
              >
                <Flag className="w-4 h-4 text-amber-500" /> Report Contact
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

