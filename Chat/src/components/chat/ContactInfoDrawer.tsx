import React from 'react';
import { X, Phone, Mail, Pin, VolumeX, ShieldAlert, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

interface ContactInfoDrawerProps {
  onClose: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({ onClose }) => {
  const { activeConversation, currentUser, togglePin, toggleMute, openModal } = useChat();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants.find((p) => p.id !== currentUser.id) ||
      activeConversation.participants[0];

  const name = isGroup ? activeConversation.name || 'Group Chat' : otherParticipant?.name || 'Contact';
  const avatar = isGroup ? activeConversation.groupAvatar : otherParticipant?.avatar;

  const handleOpenPhoto = () => {
    if (avatar) {
      openModal('media_viewer', { url: avatar, name: `${name} Profile Photo`, type: 'image' });
    }
  };

  const sharedMediaMock = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="w-80 h-full bg-white dark:bg-[#0f172a] border-l border-gray-200 dark:border-gray-800/80 flex flex-col z-20 animate-fade-in select-none">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/40">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={handleOpenPhoto}
            className="relative group cursor-pointer"
            title="Click to expand profile photo"
          >
            <Avatar src={avatar} name={name} size="xl" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
              <ZoomIn className="w-7 h-7" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-3">{name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isGroup ? `${activeConversation.participants.length} Participants` : otherParticipant?.phone}
          </p>
          <button
            onClick={handleOpenPhoto}
            className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <ZoomIn className="w-3.5 h-3.5" /> View Photo Fullscreen
          </button>
        </div>

        {/* Bio / About */}
        {!isGroup && otherParticipant?.about && (
          <div className="p-4 bg-gray-50 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              About
            </span>
            <p className="text-sm text-gray-800 dark:text-gray-200">{otherParticipant.about}</p>
          </div>
        )}

        {/* Group Description */}
        {isGroup && activeConversation.description && (
          <div className="p-4 bg-gray-50 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Group Description
            </span>
            <p className="text-sm text-gray-800 dark:text-gray-200">{activeConversation.description}</p>
          </div>
        )}

        {/* Contact Info Items */}
        {!isGroup && otherParticipant && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4 text-sky-500" />
              <span>{otherParticipant.phone}</span>
            </div>
            {otherParticipant.email && (
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 text-sky-500" />
                <span>{otherParticipant.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Shared Media Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Shared Media
            </span>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">3 items</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sharedMediaMock.map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt="Shared"
                onClick={() => openModal('media_viewer', { url: imgUrl, type: 'image' })}
                className="w-full h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>

        {/* Action Toggles */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => togglePin(activeConversation.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm text-gray-800 dark:text-gray-200"
          >
            <span className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-sky-500" /> Pin Chat
            </span>
            <span className="text-xs font-bold text-sky-600">{activeConversation.pinned ? 'YES' : 'NO'}</span>
          </button>

          <button
            onClick={() => toggleMute(activeConversation.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm text-gray-800 dark:text-gray-200"
          >
            <span className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-amber-500" /> Mute Notifications
            </span>
            <span className="text-xs font-bold text-amber-500">{activeConversation.muted ? 'MUTED' : 'OFF'}</span>
          </button>

          <button
            onClick={() => alert('Contact blocked.')}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-sm text-rose-600 dark:text-rose-400 font-semibold"
          >
            <ShieldAlert className="w-4 h-4" /> Block Contact
          </button>
        </div>
      </div>
    </div>
  );
};
