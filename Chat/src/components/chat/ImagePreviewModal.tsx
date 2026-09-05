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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Image Preview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">
                {name} • {size}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-white/10"
          />
        </div>

        {/* Footer Controls */}
        <div className="p-5 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 space-y-4">
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
              className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-[#1a2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
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
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
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
