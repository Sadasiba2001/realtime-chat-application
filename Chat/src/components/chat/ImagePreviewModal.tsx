import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { Attachment } from '../../types/chat.types';

interface ImagePreviewPayload {
  file?: File;
  previewUrl: string;
  name: string;
  size: string;
}

export const ImagePreviewModal: React.FC = () => {
  const { activeModal, modalPayload, closeModal, sendMessage } = useChat();
  const [caption, setCaption] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    if (activeModal === 'image_preview') {
      setCaption('');
      setIsSending(false);
    }
  }, [activeModal]);

  if (activeModal !== 'image_preview' || !modalPayload) return null;

  const { file, previewUrl, name, size } = modalPayload as ImagePreviewPayload;

  const handleCancel = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    closeModal();
  };

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      const attachment: Attachment = {
        id: `att_${Date.now()}`,
        type: 'image',
        url: previewUrl,
        name: name || 'image.jpg',
        size: size || 'Unknown size',
      };

      await sendMessage(caption.trim(), [attachment]);

      // Revoke temporary blob URL after message sending
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      closeModal();
    } catch {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2937]/40 dark:bg-slate-900/80 animate-fade-in select-none dark:backdrop-blur-md">
      <div className="w-full max-w-xl bg-surface dark:bg-[#111827] rounded-xl shadow-menu border border-line dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] dark:rounded-3xl dark:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-slate-800 bg-surface dark:bg-[#111827]/80 dark:backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-accent dark:text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink dark:text-slate-100">Image Preview</h3>
              <p className="text-xs text-ink-2 dark:text-slate-400 truncate max-w-[250px]">
                {name} • {size}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-ink-3 hover:text-ink dark:hover:text-slate-200 rounded-full hover:bg-surface-2 dark:hover:bg-slate-800 transition-colors dark:text-slate-400"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Container */}
        <div className="flex-1 bg-slate-950/90 p-4 flex items-center justify-center overflow-hidden min-h-[280px] max-h-[50vh] relative">
          <img
            src={previewUrl}
            alt={name || 'Selected preview'}
            className="max-w-full max-h-full object-contain rounded-xl shadow-menu border border-white/10 dark:rounded-2xl dark:shadow-xl"
          />
        </div>

        {/* Footer Controls */}
        <div className="p-5 bg-surface dark:bg-[#111827] border-t border-line dark:border-slate-800 space-y-4">
          {/* Caption Input */}
          <div className="relative">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Add an optional caption..."
              className="w-full pl-4 pr-12 py-3 bg-surface-2 dark:bg-[#1a2234] border border-line dark:border-slate-700 rounded-xl text-xs text-ink dark:text-slate-100 placeholder-ink-3 dark:placeholder-slate-500 outline-none focus:border-accent-2 focus:ring-1 focus:ring-accent/20 transition-all dark:rounded-2xl dark:focus:border-purple-500 dark:focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-softer transition-all disabled:opacity-50 cursor-pointer dark:shadow-purple-600/20 dark:bg-purple-600 dark:hover:bg-purple-700 dark:shadow-md"
            >
              {isSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
