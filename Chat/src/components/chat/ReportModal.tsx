import React, { useState } from 'react';
import { Flag, X, AlertCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ReportModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  targetUserId?: string;
  userName?: string;
}

const REPORT_REASONS = [
  { id: 'SPAM', label: 'Spam', desc: 'Unwanted messages, repetitive links, or commercial promotion' },
  { id: 'HARASSMENT', label: 'Harassment', desc: 'Targeted bullying, threats, or intimidation' },
  { id: 'ABUSE', label: 'Abuse', desc: 'Hate speech, discrimination, or abusive language' },
  { id: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content', desc: 'Nudity, violence, or offensive material' },
  { id: 'OTHER', label: 'Other', desc: 'Other policy violation or reason' },
];

export const ReportModal: React.FC<ReportModalProps> = (props) => {
  const { activeModal, modalPayload, closeModal, reportUser, activeConversation, currentUser } = useChat();

  const isGlobalModal = activeModal === 'report_user';
  const isOpen = props.isOpen !== undefined ? props.isOpen : isGlobalModal;
  const onClose = props.onClose || closeModal;

  const targetUserId =
    props.targetUserId ||
    (modalPayload as { targetUserId?: string; id?: string })?.targetUserId ||
    (modalPayload as { id?: string })?.id ||
    (activeConversation ? activeConversation.participantIds.find((pid) => pid !== currentUser?.id) || activeConversation.id : undefined);

  const userName =
    props.userName ||
    (modalPayload as { userName?: string; name?: string })?.userName ||
    (modalPayload as { name?: string })?.name ||
    (activeConversation ? activeConversation.name || 'User' : 'User');

  const [selectedReason, setSelectedReason] = useState<string>('SPAM');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetUserId) {
      setErrorMessage('Target user ID is missing.');
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
      await reportUser(targetUserId, selectedReason, description.trim());
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit report. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2937]/30 dark:bg-black/60 animate-fade-in">
      <div className="w-full max-w-md bg-surface dark:bg-g-bg2 rounded-xl shadow-menu border border-line dark:border-g-line overflow-hidden flex flex-col max-h-[90vh] dark:shadow-g">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-g-line bg-surface dark:bg-g-bg2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink dark:text-g-text">Report User</h3>
              <p className="text-xs text-ink-2 dark:text-g-text2">Report @{userName} for misconduct</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink dark:hover:text-g-text rounded-full hover:bg-surface-2 dark:hover:bg-g-hover transition-colors dark:text-g-text2"
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

          <div>
            <label className="block text-xs font-bold text-ink dark:text-g-text2 uppercase tracking-wider mb-2">
              Why are you reporting this user?
            </label>

            <div className="space-y-2">
              {REPORT_REASONS.map((r) => {
                const isChecked = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-ink dark:text-g-text shadow-xs'
                        : 'border-line dark:border-g-line hover:bg-surface-2 dark:hover:bg-g-hover text-ink dark:text-g-text2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={isChecked}
                      onChange={() => {
                        setSelectedReason(r.id);
                        setErrorMessage(null);
                      }}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{r.label}</span>
                      <span className="block text-xs text-ink-2 dark:text-g-text2 font-normal mt-0.5">{r.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-ink dark:text-g-text2 uppercase tracking-wider">
                Explanation {selectedReason === 'OTHER' ? <span className="text-rose-500">*</span> : '(Optional)'}
              </label>
              <span className="text-[10px] text-ink-3 font-mono dark:text-g-text2">{description.length}/500</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={selectedReason === 'OTHER' ? 'Please describe the issue in detail...' : 'Additional details (optional)...'}
              className="w-full p-3 bg-surface-2 dark:bg-g-s2 border border-line dark:border-g-line rounded-xl text-xs text-ink dark:text-g-text placeholder-ink-3 dark:placeholder-g-text3 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-2 dark:text-g-text2 hover:bg-surface-2 dark:hover:bg-g-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-softer transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer dark:shadow-none"
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
