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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Forward Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Banner */}
        <div className="p-3.5 mx-4 mt-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200/80 dark:border-white/5 text-xs">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">Forwarding Content:</span>
          <p className="text-slate-700 dark:text-slate-300 italic truncate max-h-12">{message.text}</p>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts or chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1 divide-y divide-slate-100 dark:divide-white/5">
          {filteredConversations.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No chats found.</p>
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
                      ? 'bg-indigo-50/80 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.lastMessage?.text || 'Click to select'}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
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
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#111827]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedContactIds.length === 0 || isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Forward {selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
