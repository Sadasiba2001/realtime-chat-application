import React, { useState } from 'react';
import { VolumeX, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface MuteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: (duration: string) => Promise<void>;
  chatName?: string;
}

export const MuteModal: React.FC<MuteModalProps> = (props) => {
  const { activeModal, modalPayload, closeModal, toggleMute } = useChat();

  const isGlobalModal = activeModal === 'mute_chat';
  const isOpen = props.isOpen !== undefined ? props.isOpen : isGlobalModal;
  const onClose = props.onClose || closeModal;

  const conversationId = (modalPayload as { id?: string })?.id;

  const [selectedDuration, setSelectedDuration] = useState<string>('always');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (props.onConfirm) {
        await props.onConfirm(selectedDuration);
      } else if (conversationId) {
        await toggleMute(conversationId, selectedDuration);
      }
      onClose();
    } catch (err) {
      console.error('Failed to mute chat:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    { id: '1h', label: '1 hour' },
    { id: '8h', label: '8 hours' },
    { id: '1w', label: '1 week' },
    { id: 'always', label: 'Always' },
  ];

  return (
    <div className="fixed inset-0 bg-[#1f2937]/30 dark:bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in dark:backdrop-blur-xs">
      <div className="bg-surface dark:bg-[#1a2234] border border-line dark:border-slate-800 rounded-xl shadow-menu max-w-sm w-full p-5 overflow-hidden animate-scale-in dark:rounded-2xl dark:shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-line dark:border-slate-800">
          <div className="flex items-center gap-2 text-ink dark:text-slate-100 font-semibold text-base">
            <VolumeX className="w-5 h-5 text-amber-500" />
            <span>Mute notifications</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-3 hover:text-ink dark:hover:text-slate-200 rounded-lg transition-colors dark:text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-2 dark:text-slate-400 mt-3 mb-4">
          Other participants will not see that you muted this chat. You will still receive messages normally.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedDuration === opt.id
                  ? 'border-amber-500/60 bg-amber-500/10 text-ink dark:text-slate-100'
                  : 'border-line dark:border-slate-800 hover:bg-surface-2 dark:hover:bg-slate-800/60 text-ink dark:text-slate-300'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <input
                type="radio"
                name="muteDuration"
                value={opt.id}
                checked={selectedDuration === opt.id}
                onChange={() => setSelectedDuration(opt.id)}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-line dark:border-slate-700"
              />
            </label>
          ))}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-ink-2 dark:text-slate-300 hover:bg-surface-2 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl shadow-softer transition-all flex items-center gap-1.5 disabled:opacity-50 dark:shadow-md"
            >
              {isSubmitting ? 'Saving...' : 'Mute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
