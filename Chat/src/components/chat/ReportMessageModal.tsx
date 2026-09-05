import React, { useState } from 'react';
import { Flag, X, AlertCircle, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ReportMessageModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  messageId?: string;
  messageText?: string;
  senderName?: string;
}

const REPORT_REASONS = [
  { id: 'SPAM', label: 'Spam', desc: 'Unwanted messages, repetitive links, or commercial promotion' },
  { id: 'HARASSMENT', label: 'Harassment', desc: 'Targeted bullying, threats, or intimidation' },
  { id: 'ABUSE', label: 'Abuse', desc: 'Hate speech, discrimination, or abusive language' },
  { id: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content', desc: 'Nudity, violence, or offensive material' },
  { id: 'OTHER', label: 'Other', desc: 'Other policy violation or reason' },
];

export const ReportMessageModal: React.FC<ReportMessageModalProps> = (props) => {
  const { activeModal, modalPayload, closeModal, reportMessage } = useChat();

  const isGlobalModal = activeModal === 'report_message';
  const isOpen = props.isOpen !== undefined ? props.isOpen : isGlobalModal;
  const onClose = props.onClose || closeModal;

  const messageId = props.messageId || (modalPayload as { messageId?: string })?.messageId;
  const messageText = props.messageText || (modalPayload as { messageText?: string })?.messageText || 'Reported message';
  const senderName = props.senderName || (modalPayload as { senderName?: string })?.senderName || 'Sender';

  const [selectedReason, setSelectedReason] = useState<string>('SPAM');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!messageId) {
      setErrorMessage('Reported message ID is missing.');
      return;
    }

    if (selectedReason === 'OTHER' && !description.trim()) {
      setErrorMessage('Please provide an explanation description when selecting Other.');
      return;
    }

    if (description.length > 500) {
      setErrorMessage('Description cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportMessage(messageId, selectedReason, description.trim());
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit report. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Report Message</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Report message from {senderName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Message Preview Banner */}
          <div className="p-3 bg-slate-50 dark:bg-[#1a2234] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Reported Message Preview</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-3 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/40 dark:border-white/5">
              "{messageText}"
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Why are you reporting this message?
            </label>

            <div className="space-y-2">
              {REPORT_REASONS.map((r) => {
                const isChecked = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportMessageReason"
                      value={r.id}
                      checked={isChecked}
                      onChange={() => {
                        setSelectedReason(r.id);
                        setErrorMessage(null);
                      }}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{r.label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">{r.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Explanation {selectedReason === 'OTHER' ? <span className="text-rose-500">*</span> : '(Optional)'}
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{description.length}/500</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={selectedReason === 'OTHER' ? 'Please describe the issue in detail...' : 'Additional details (optional)...'}
              className="w-full p-3 bg-slate-50 dark:bg-[#1a2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
