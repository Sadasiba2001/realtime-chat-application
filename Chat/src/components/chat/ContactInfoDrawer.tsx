import React from 'react';
import { X, Phone, Mail, Pin, VolumeX, ShieldAlert, ZoomIn, Flag } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

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
    <div className="w-80 h-full bg-white dark:bg-[#111827] border-l border-slate-200/80 dark:border-white/10 flex flex-col z-30 animate-fade-in select-none shadow-2xl">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">{name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isGroup ? `${activeConversation.participants.length} Participants` : otherParticipant?.phone}
          </p>
          {hasCustomAvatar && (
            <button
              onClick={handleOpenPhoto}
              className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <ZoomIn className="w-3.5 h-3.5" /> View Photo Fullscreen
            </button>
          )}
        </div>

        {/* Bio / About */}
        {!isGroup && otherParticipant?.about && (
          <div className="p-4 bg-slate-50 dark:bg-[#1a2234] rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              About
            </span>
            <p className="text-sm text-slate-800 dark:text-slate-200">{otherParticipant.about}</p>
          </div>
        )}

        {/* Group Description */}
        {isGroup && activeConversation.description && (
          <div className="p-4 bg-slate-50 dark:bg-[#1a2234] rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
              Group Description
            </span>
            <p className="text-sm text-slate-800 dark:text-slate-200">{activeConversation.description}</p>
          </div>
        )}

        {/* Contact Info Items */}
        {!isGroup && otherParticipant && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#1a2234] rounded-2xl border border-slate-200/60 dark:border-white/5">
              <Phone className="w-4 h-4 text-violet-500" />
              <div>
                <p className="text-[11px] text-slate-400">Phone</p>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {otherParticipant.phone || 'Not provided'}
                </p>
              </div>
            </div>

            {otherParticipant.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#1a2234] rounded-2xl border border-slate-200/60 dark:border-white/5">
                <Mail className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-[11px] text-slate-400">Email</p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{otherParticipant.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => togglePin(activeConversation.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#1a2234] hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-2xl transition-colors text-sm text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/5"
          >
            <span className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-violet-500" /> Pin Chat
            </span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{activeConversation.pinned ? 'YES' : 'NO'}</span>
          </button>

          <button
            onClick={() => {
              if (activeConversation.muted) {
                toggleMute(activeConversation.id);
              } else {
                openModal('mute_chat', activeConversation);
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#1a2234] hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-2xl transition-colors text-sm text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/5"
          >
            <span className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-amber-500" /> Mute Notifications
            </span>
            <span className="text-xs font-bold text-amber-500">{activeConversation.muted ? 'MUTED' : 'OFF'}</span>
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
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition-colors text-sm text-rose-600 dark:text-rose-400 font-semibold border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> {activeConversation.isBlocked ? 'Unblock Contact' : 'Block Contact'}
                </span>
                <span className="text-xs font-bold text-rose-500">{activeConversation.isBlocked ? 'BLOCKED' : ''}</span>
              </button>

              <button
                onClick={() => {
                  openModal('report_user', activeConversation);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-2xl transition-colors text-sm text-amber-600 dark:text-amber-400 font-semibold border border-transparent hover:border-amber-200 dark:hover:border-amber-900/50"
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

