import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic, X, Trash2, Check, Pencil } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { AttachmentMenu } from './AttachmentMenu';
import { EmojiPicker } from '../common/EmojiPicker';
import type { Attachment } from '../../types/chat.types';

export const MessageComposer: React.FC = () => {
  const { sendMessage, editMessage, replyingToMessage, setReplyTo, editingMessage, setEditingMessage } = useChat();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Voice recording mock state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    if (editingMessage) {
      editMessage(editingMessage.id, text.trim());
      setText('');
      setEditingMessage(null);
    } else {
      sendMessage(text, attachments.length > 0 ? attachments : undefined);
      setText('');
      setAttachments([]);
    }
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
    <footer className="p-2.5 md:p-3 bg-transparent select-none relative z-20">
      {/* Reply-To Preview Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md rounded-2xl border-l-4 border-l-violet-500 border border-slate-200/80 dark:border-white/10 text-xs shadow-md">
          <div className="min-w-0 flex-1 pr-2">
            <span className="font-bold text-violet-600 dark:text-violet-400">
              Replying to {replyingToMessage.senderName}
            </span>
            <p className="truncate text-slate-600 dark:text-slate-300">{replyingToMessage.text}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Message Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md rounded-2xl border-l-4 border-l-indigo-500 border border-slate-200/80 dark:border-white/10 text-xs shadow-md">
          <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                Editing Message
              </span>
              <p className="truncate text-slate-600 dark:text-slate-300">{editingMessage.text}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cancel edit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-violet-50 dark:bg-violet-950/50 px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800/80 text-xs shadow-xs"
            >
              <span className="font-semibold text-violet-700 dark:text-violet-300">{att.name || att.type}</span>
              <button
                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                className="text-rose-500 hover:text-rose-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Popovers */}
      {showAttachmentMenu && (
        <div className="absolute bottom-full left-4 mb-2 z-40">
          <AttachmentMenu
            onSelectAttachment={handleSelectAttachment}
            onClose={() => setShowAttachmentMenu(false)}
          />
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full right-16 mb-2 z-40">
          <EmojiPicker onSelectEmoji={handleSelectEmoji} />
        </div>
      )}

      {/* Floating Capsule Composer */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-4 py-2 px-5 bg-rose-50/95 dark:bg-rose-950/60 backdrop-blur-md rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
            <span className="font-mono text-sm font-semibold">
              0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="p-2 hover:bg-rose-200/80 dark:hover:bg-rose-900/60 rounded-full transition-colors"
              title="Cancel"
            >
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </button>
            <button
              onClick={stopAndSendRecording}
              className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-full transition-transform hover:scale-105 shadow-md"
              title="Send Voice Note"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2 bg-white/95 dark:bg-[#1a2234]/95 backdrop-blur-md p-1.5 md:p-2 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg transition-all">
          {/* Attachment Button */}
          <button
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${showAttachmentMenu
                ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 -rotate-45" />
          </button>

          {/* Auto-expanding Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 max-h-32 min-h-[38px] py-2 px-2 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-hidden resize-none"
          />

          {/* Emoji Button */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${showEmojiPicker
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send or Voice Record Action Button */}
          {text.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/25 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-2.5 text-slate-400 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 rounded-full transition-all active:scale-95"
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

