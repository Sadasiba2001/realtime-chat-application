import React, { useState } from 'react';
import { Search, Share2, Check, X } from 'lucide-react';
import type { Message } from '../../types/chat.types';
import { useChat } from '../../context/ChatContext';

interface ForwardModalProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, isOpen, onClose }) => {
  const { conversations, forwardMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredConversations = conversations.filter((c) => {
    const cName = c?.name || c?.participants?.[0]?.name || `User ${c.id}`;
    return cName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSelect = (userId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedContactIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await forwardMessage(message.id, selectedContactIds);
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2937]/30 dark:bg-black/60 animate-fade-in">
      <div className="w-full max-w-md bg-surface dark:bg-g-s2 rounded-xl shadow-menu border border-line dark:border-g-line overflow-hidden flex flex-col max-h-[85vh] dark:shadow-g">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-g-line2">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent dark:text-gold" />
            <h3 className="font-bold text-ink dark:text-g-text text-base">Forward Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-3 hover:text-ink dark:hover:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover transition-colors dark:text-g-text2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Banner */}
        <div className="p-3.5 mx-4 mt-3 rounded-xl bg-surface-2 dark:bg-g-bg2 border border-line dark:border-g-line2 text-xs">
          <span className="font-semibold text-accent dark:text-gold block mb-1">Forwarding Content:</span>
          <p className="text-ink dark:text-g-text2 italic truncate max-h-12">{message.text}</p>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-3 dark:text-g-text2" />
            <input
              type="text"
              placeholder="Search contacts or chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-2 dark:bg-g-s2 border border-line dark:border-g-line rounded-xl text-ink dark:text-g-text focus:outline-none focus:ring-2 focus:ring-accent/20 dark:focus:ring-gold/30"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1 divide-y divide-slate-100 dark:divide-g-line2">
          {filteredConversations.length === 0 ? (
            <p className="text-center py-6 text-xs text-ink-3 dark:text-g-text2">No chats found.</p>
          ) : (
            filteredConversations.map((c) => {
              const targetUserId = c.participants?.[0]?.id || c.id;
              const isSelected = selectedContactIds.includes(targetUserId);
              const displayName = c.name || c.participants?.[0]?.name || `User ${c.id}`;

              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(targetUserId)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent-soft dark:bg-gold/12'
                      : 'hover:bg-surface-2 dark:hover:bg-g-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                      alt={displayName}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-line dark:border-g-line"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-ink dark:text-g-text truncate">{displayName}</p>
                      <p className="text-[11px] text-ink-3 truncate dark:text-g-text2">{c.lastMessage?.text || 'Click to select'}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-accent border-accent text-white dark:bg-gold dark:border-gold/30 dark:text-[#171717]'
                        : 'border-line dark:border-g-line bg-surface dark:bg-g-s2'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-line dark:border-g-line2 bg-surface-2 dark:bg-g-bg2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-2 dark:text-g-text2 hover:bg-surface-2 dark:hover:bg-g-hover rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedContactIds.length === 0 || isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-softer transition-all flex items-center gap-1.5 dark:bg-gold dark:hover:bg-gold-light dark:shadow-none dark:text-[#171717]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Forward {selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
