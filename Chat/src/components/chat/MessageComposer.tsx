import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic, X, Trash2, Check, Pencil, ShieldAlert } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { AttachmentMenu } from './AttachmentMenu';
import { EmojiPicker } from '../common/EmojiPicker';
import type { Attachment } from '../../types/chat.types';

export const MessageComposer: React.FC = () => {
  const { sendMessage, editMessage, replyingToMessage, setReplyTo, editingMessage, setEditingMessage, sendTyping, activeConversation, currentUser, unblockUser, setActiveNotification } = useChat();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Real Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Debounced Typing logic
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSentRef = useRef(false);

  const stopTypingNow = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTypingSentRef.current) {
      sendTyping(false);
      isTypingSentRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      stopTypingNow();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    stopTypingNow();
    if (editingMessage) {
      editMessage(editingMessage.id, text.trim());
      setEditingMessage(null);
    } else {
      sendMessage(text.trim(), attachments);
    }
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      if (!isTypingSentRef.current) {
        sendTyping(true);
        isTypingSentRef.current = true;
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTyping(false);
        isTypingSentRef.current = false;
        typingTimerRef.current = null;
      }, 3000);
    } else {
      stopTypingNow();
    }
  };

  const handleSelectAttachment = (att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
    setShowAttachmentMenu(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (setActiveNotification) {
          setActiveNotification({
            id: `err_${Date.now()}`,
            type: 'error',
            message: 'Voice recording is not supported in this browser.',
          });
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setIsPreviewing(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPreviewing(false);
      setRecordSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'Microphone permission is required to record a voice message.',
        });
      }
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setIsRecording(false);
    setIsPreviewing(false);
    setAudioBlob(null);
    setPreviewUrl(null);
    setRecordSeconds(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    setIsUploadingVoice(true);
    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([audioBlob], `voice_note_${Date.now()}.${ext}`, { type: audioBlob.type || 'audio/webm' });
      const uploadedAtt = await chatService.uploadFile(file);

      const mins = Math.floor(recordSeconds / 60);
      const secs = recordSeconds % 60;
      const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const voiceAttachment: Attachment = {
        id: uploadedAtt.id,
        type: 'audio',
        url: uploadedAtt.url,
        name: uploadedAtt.name || 'Voice Message',
        size: uploadedAtt.size,
        duration: formattedDuration,
      };

      sendMessage('🎤 Voice Message', [voiceAttachment]);
      cancelRecording();
    } catch (err: any) {
      if (setActiveNotification) {
        setActiveNotification({
          id: `err_${Date.now()}`,
          type: 'error',
          message: 'Voice message could not be uploaded. Try again.',
        });
      }
    } finally {
      setIsUploadingVoice(false);
    }
  };

  return (
    <footer className="p-2.5 md:px-6 md:pb-5 md:pt-2 dark:md:p-3 bg-canvas dark:bg-transparent select-none relative z-20">
      {activeConversation?.isBlocked ? (
        <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 rounded-xl dark:rounded-2xl text-xs text-red-800 dark:text-rose-200 dark:shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger dark:text-rose-500 flex-shrink-0" />
            <span className="font-medium">You blocked this user. Unblock to send messages.</span>
          </div>
          <button
            onClick={() => {
              const partnerId = activeConversation.participantIds.find((pid) => pid !== currentUser.id) || activeConversation.id;
              unblockUser(partnerId);
            }}
            className="px-3 py-1.5 dark:py-1 bg-surface dark:bg-rose-600 hover:bg-red-50 dark:hover:bg-rose-700 dark:active:bg-rose-800 text-danger dark:text-white border border-red-200 dark:border-0 font-semibold rounded-lg dark:rounded-xl dark:shadow-xs transition-all cursor-pointer"
          >
            Unblock
          </button>
        </div>
      ) : activeConversation?.isBlockedByThem ? (
        <div className="flex items-center gap-2 p-3.5 bg-surface-2 dark:bg-slate-800/80 border border-line dark:border-slate-700 rounded-xl dark:rounded-2xl text-xs text-ink-2 dark:text-slate-300 dark:shadow-md">
          <ShieldAlert className="w-4 h-4 text-ink-3 dark:text-slate-400 flex-shrink-0" />
          <span className="font-medium">Messaging is unavailable because this user has blocked you.</span>
        </div>
      ) : (
        <>
          {/* Reply-To Preview Banner */}
          {replyingToMessage && (
            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-surface dark:bg-[#1a2234]/95 dark:backdrop-blur-md rounded-lg dark:rounded-2xl border-l-3 dark:border-l-4 border-l-accent dark:border-l-violet-500 border border-line dark:border-white/10 text-xs shadow-softer dark:shadow-md">
              <div className="min-w-0 flex-1 pr-2">
                <span className="font-semibold dark:font-bold text-accent dark:text-violet-400">
                  Replying to {replyingToMessage.senderName}
                </span>
                <p className="truncate text-ink-2 dark:text-slate-300">{replyingToMessage.text}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 rounded-md dark:rounded-full text-ink-3 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-surface-2 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Editing Message Banner */}
          {editingMessage && (
            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-surface dark:bg-[#1a2234]/95 dark:backdrop-blur-md rounded-lg dark:rounded-2xl border-l-3 dark:border-l-4 border-l-accent dark:border-l-indigo-500 border border-line dark:border-white/10 text-xs shadow-softer dark:shadow-md">
              <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-accent dark:text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold dark:font-bold text-accent dark:text-indigo-400 block">
                    Editing Message
                  </span>
                  <p className="truncate text-ink-2 dark:text-slate-300">{editingMessage.text}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setText('');
                }}
                className="p-1 rounded-md dark:rounded-full text-ink-3 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-surface-2 dark:hover:bg-slate-800 transition-colors"
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
                  className="flex items-center gap-2 bg-accent-soft dark:bg-violet-950/50 px-3 py-1.5 rounded-md dark:rounded-full border border-accent-active dark:border-violet-800/80 text-xs dark:shadow-xs"
                >
                  <span className="font-medium dark:font-semibold text-accent dark:text-violet-300">{att.name || att.type}</span>
                  <button
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="text-ink-3 hover:text-danger dark:text-rose-500 dark:hover:text-rose-600 transition-colors"
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
            <div className="flex items-center justify-between gap-4 py-2 px-4 dark:px-5 bg-surface dark:bg-rose-950/60 dark:backdrop-blur-md rounded-xl dark:rounded-full border border-line dark:border-rose-900/50 text-danger dark:text-rose-400 shadow-soft dark:shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 dark:w-3 dark:h-3 bg-danger dark:bg-rose-600 rounded-full animate-pulse dark:animate-ping" />
                <span className="font-mono text-sm font-semibold">
                  🔴 Recording {Math.floor(recordSeconds / 60)}:{recordSeconds % 60 < 10 ? '0' : ''}{recordSeconds % 60}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 hover:bg-red-50 dark:hover:bg-rose-900/60 rounded-lg dark:rounded-full transition-colors text-xs font-semibold"
                  title="Cancel Recording"
                >
                  <Trash2 className="w-5 h-5 text-danger dark:text-rose-400" />
                </button>
                <button
                  onClick={stopRecording}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover dark:bg-gradient-to-tr dark:from-violet-600 dark:to-indigo-600 text-white font-semibold text-xs rounded-lg dark:rounded-full transition-all dark:hover:scale-105 dark:shadow-md flex items-center gap-1.5"
                  title="Stop & Preview"
                >
                  <Check className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
          ) : isPreviewing && previewUrl ? (
            <div className="flex items-center justify-between gap-3 py-2 px-4 bg-surface dark:bg-[#1a2234]/95 dark:backdrop-blur-md rounded-xl dark:rounded-2xl border border-line dark:border-white/10 shadow-soft dark:shadow-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold dark:font-bold text-accent dark:text-violet-400 mb-1 flex items-center gap-1">
                  🎤 Voice Message Preview ({Math.floor(recordSeconds / 60)}:{recordSeconds % 60 < 10 ? '0' : ''}{recordSeconds % 60})
                </p>
                <audio src={previewUrl} controls className="w-full h-8" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={cancelRecording}
                  disabled={isUploadingVoice}
                  className="p-2 text-danger dark:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg dark:rounded-xl transition-colors"
                  title="Cancel"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={sendVoiceMessage}
                  disabled={isUploadingVoice}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover dark:bg-gradient-to-tr dark:from-violet-600 dark:to-indigo-600 text-white font-semibold text-xs rounded-lg dark:rounded-xl dark:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> {isUploadingVoice ? 'Uploading...' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-1 dark:gap-2 bg-surface dark:bg-[#1a2234]/95 dark:backdrop-blur-md p-1.5 dark:md:p-2 rounded-xl dark:rounded-3xl border border-line dark:border-white/10 shadow-soft dark:shadow-lg focus-within:border-accent-2 dark:focus-within:border-white/10 transition-all">
              {/* Attachment Button */}
              <button
                onClick={() => {
                  setShowAttachmentMenu(!showAttachmentMenu);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 dark:p-2.5 rounded-lg dark:rounded-full transition-all dark:active:scale-95 ${showAttachmentMenu
                    ? 'bg-accent-soft dark:bg-violet-950/80 text-accent dark:text-violet-400'
                    : 'text-ink-3 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-surface-2 dark:hover:bg-slate-800/80'
                  }`}
                title="Attach file"
              >
                <Paperclip className="w-5 h-5 -rotate-45" />
              </button>

              {/* Auto-expanding Textarea */}
              <textarea
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                rows={1}
                className="flex-1 max-h-32 min-h-[38px] py-2 px-2 text-sm bg-transparent text-ink dark:text-slate-100 placeholder-ink-3 dark:placeholder-slate-500 outline-hidden resize-none"
              />

              {/* Emoji Button */}
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachmentMenu(false);
                }}
                className={`p-2 dark:p-2.5 rounded-lg dark:rounded-full transition-all dark:active:scale-95 ${showEmojiPicker
                    ? 'bg-accent-soft dark:bg-amber-950/80 text-accent dark:text-amber-400'
                    : 'text-ink-3 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-surface-2 dark:hover:bg-slate-800/80'
                  }`}
                title="Emoji picker"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Send or Voice Record Action Button */}
              {text.trim() || attachments.length > 0 ? (
                <button
                  onClick={handleSend}
                  className="w-9 h-9 dark:w-auto dark:h-auto dark:p-2.5 bg-accent hover:bg-accent-hover dark:bg-gradient-to-tr dark:from-violet-600 dark:to-indigo-600 dark:hover:from-violet-500 dark:hover:to-indigo-500 text-white rounded-lg dark:rounded-full transition-all dark:hover:scale-105 active:scale-95 dark:shadow-md dark:shadow-indigo-500/25 flex items-center justify-center"
                  title="Send message"
                >
                  <Send className="w-4 h-4 dark:w-4.5 dark:h-4.5" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="p-2 dark:p-2.5 text-ink-3 dark:text-slate-400 hover:text-accent dark:hover:text-violet-400 hover:bg-accent-soft dark:hover:bg-violet-950/50 rounded-lg dark:rounded-full transition-all dark:active:scale-95"
                  title="Record voice note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </footer>
  );
};
