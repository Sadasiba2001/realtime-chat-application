import React, { useState, useRef } from 'react';
import { Plus, Smile, Send, Mic, X, Trash2, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { AttachmentMenu } from './AttachmentMenu';
import { EmojiPicker } from '../common/EmojiPicker';
import type { Attachment } from '../../types/chat.types';

export const MessageComposer: React.FC = () => {
  const { sendMessage, replyingToMessage, setReplyTo } = useChat();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Voice recording mock state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    sendMessage(text, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
    setShowAttachmentMenu(false);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleSelectAttachment = (attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  // Voice record handler
  const startRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);
    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const stopAndSendRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    const mockAudio: Attachment = {
      id: `audio_${Date.now()}`,
      type: 'audio',
      url: '#',
      name: 'Voice Note',
      duration: `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`,
    };
    sendMessage('🎤 Voice Message', [mockAudio]);
    setRecordSeconds(0);
  };

  return (
    <footer className="relative bg-white dark:bg-[#0f172a] border-t border-gray-200 dark:border-gray-800/80 px-4 py-3 select-none">
      {/* Reply-To Preview Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-3 py-2 mb-2 bg-gray-100 dark:bg-slate-900 rounded-xl border-l-4 border-l-sky-500 text-xs">
          <div>
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              Replying to {replyingToMessage.senderName}
            </span>
            <p className="truncate text-gray-600 dark:text-gray-300">{replyingToMessage.text}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-xs"
            >
              <span className="font-semibold text-sky-700 dark:text-sky-300">{att.name || att.type}</span>
              <button
                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                className="text-rose-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Popovers */}
      {showAttachmentMenu && (
        <div className="absolute bottom-full left-4 mb-2">
          <AttachmentMenu
            onSelectAttachment={handleSelectAttachment}
            onClose={() => setShowAttachmentMenu(false)}
          />
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-12 mb-2">
          <EmojiPicker onSelectEmoji={handleSelectEmoji} />
        </div>
      )}

      {/* Main Composer Controls */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-4 py-1.5 px-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
            <span className="font-mono text-sm font-semibold">
              0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="p-2 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-full transition-colors"
              title="Cancel"
            >
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </button>
            <button
              onClick={stopAndSendRecording}
              className="p-2 bg-sky-600 text-white rounded-full transition-transform hover:scale-105 shadow-md"
              title="Send Voice Note"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showAttachmentMenu
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title="Attach file"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Emoji Button */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showEmojiPicker
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Auto-expanding Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 max-h-32 min-h-[42px] py-2.5 px-4 text-sm bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl outline-hidden focus:ring-2 focus:ring-sky-500/50 resize-none transition-all"
          />

          {/* Send or Voice Record Button */}
          {text.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl transition-transform hover:scale-105 shadow-md shadow-blue-600/30 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-3 bg-gray-100 dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-sky-950 text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-2xl transition-colors"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </footer>
  );
};
