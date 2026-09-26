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
    <footer className="p-2.5 md:px-6 md:pb-5 md:pt-2 bg-canvas dark:bg-transparent select-none relative z-20">
      {activeConversation?.isBlocked ? (
        <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 rounded-xl text-xs text-red-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger dark:text-rose-500 flex-shrink-0" />
            <span className="font-medium">You blocked this user. Unblock to send messages.</span>
          </div>
          <button
            onClick={() => {
              const partnerId = activeConversation.participantIds.find((pid) => pid !== currentUser.id) || activeConversation.id;
              unblockUser(partnerId);
            }}
            className="px-3 py-1.5 bg-surface dark:bg-rose-600 hover:bg-red-50 dark:hover:bg-rose-700 dark:active:bg-rose-800 text-danger dark:text-g-text border border-red-200 dark:border-transparent font-semibold rounded-lg transition-all cursor-pointer"
          >
            Unblock
          </button>
        </div>
      ) : activeConversation?.isBlockedByThem ? (
        <div className="flex items-center gap-2 p-3.5 bg-surface-2 dark:bg-g-s2 border border-line dark:border-g-line rounded-xl text-xs text-ink-2 dark:text-g-text2">
          <ShieldAlert className="w-4 h-4 text-ink-3 dark:text-g-text2 flex-shrink-0" />
          <span className="font-medium">Messaging is unavailable because this user has blocked you.</span>
        </div>
      ) : (
        <>
          {/* Reply-To Preview Banner */}
          {replyingToMessage && (
            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-surface dark:bg-g-s2 rounded-lg border-l-3 border-l-accent dark:border-l-gold border border-line dark:border-g-line text-xs shadow-softer dark:shadow-none">
              <div className="min-w-0 flex-1 pr-2">
                <span className="font-semibold text-accent dark:text-gold">
                  Replying to {replyingToMessage.senderName}
                </span>
                <p className="truncate text-ink-2 dark:text-g-text2">{replyingToMessage.text}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 rounded-md text-ink-3 dark:text-g-text2 hover:text-ink dark:hover:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Editing Message Banner */}
          {editingMessage && (
            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-surface dark:bg-g-s2 rounded-lg border-l-3 border-l-accent dark:border-l-gold border border-line dark:border-g-line text-xs shadow-softer dark:shadow-none">
              <div className="min-w-0 flex-1 pr-2 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-accent dark:text-gold flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-accent dark:text-gold block">
                    Editing Message
                  </span>
                  <p className="truncate text-ink-2 dark:text-g-text2">{editingMessage.text}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setText('');
                }}
                className="p-1 rounded-md text-ink-3 dark:text-g-text2 hover:text-ink dark:hover:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover transition-colors"
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
                  className="flex items-center gap-2 bg-accent-soft dark:bg-gold/12 px-3 py-1.5 rounded-md border border-accent-active dark:border-gold/30 text-xs"
                >
                  <span className="font-medium text-accent dark:text-gold">{att.name || att.type}</span>
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
            <div className="flex items-center justify-between gap-4 py-2 px-4 bg-surface dark:bg-rose-950/60 rounded-xl border border-line dark:border-rose-900/50 text-danger dark:text-rose-400 shadow-soft dark:shadow-g">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-danger dark:bg-rose-600 rounded-full animate-pulse" />
                <span className="font-mono text-sm font-semibold">
                  🔴 Recording {Math.floor(recordSeconds / 60)}:{recordSeconds % 60 < 10 ? '0' : ''}{recordSeconds % 60}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 hover:bg-red-50 dark:hover:bg-rose-900/60 rounded-lg transition-colors text-xs font-semibold"
                  title="Cancel Recording"
                >
                  <Trash2 className="w-5 h-5 text-danger dark:text-rose-400" />
                </button>
                <button
                  onClick={stopRecording}
                  className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 dark:bg-gold dark:hover:bg-gold-light dark:text-[#171717]"
                  title="Stop & Preview"
                >
                  <Check className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
          ) : isPreviewing && previewUrl ? (
            <div className="flex items-center justify-between gap-3 py-2 px-4 bg-surface dark:bg-g-s2 rounded-xl border border-line dark:border-g-line shadow-soft dark:shadow-g">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-accent dark:text-gold mb-1 flex items-center gap-1">
                  🎤 Voice Message Preview ({Math.floor(recordSeconds / 60)}:{recordSeconds % 60 < 10 ? '0' : ''}{recordSeconds % 60})
                </p>
                <audio src={previewUrl} controls className="w-full h-8" />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={cancelRecording}
                  disabled={isUploadingVoice}
                  className="p-2 text-danger dark:text-rose-500 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={sendVoiceMessage}
                  disabled={isUploadingVoice}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 dark:bg-gold dark:hover:bg-gold-light dark:text-[#171717]"
                >
                  <Send className="w-4 h-4" /> {isUploadingVoice ? 'Uploading...' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-1 bg-surface dark:bg-g-s1 p-1.5 rounded-xl border border-line dark:border-g-line shadow-soft dark:shadow-g focus-within:border-accent-2 dark:focus-within:border-gold/50 transition-all">
              {/* Attachment Button */}
              <button
                onClick={() => {
                  setShowAttachmentMenu(!showAttachmentMenu);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 rounded-lg transition-all ${showAttachmentMenu
                    ? 'bg-accent-soft dark:bg-gold/12 text-accent dark:text-gold'
                    : 'text-ink-3 dark:text-g-text2 hover:text-ink dark:hover:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover'
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
                className="flex-1 max-h-32 min-h-[38px] py-2 px-2 text-sm bg-transparent text-ink dark:text-g-text placeholder-ink-3 dark:placeholder-g-text3 outline-hidden resize-none"
              />

              {/* Emoji Button */}
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachmentMenu(false);
                }}
                className={`p-2 rounded-lg transition-all ${showEmojiPicker
                    ? 'bg-accent-soft dark:bg-gold/12 text-accent dark:text-gold'
                    : 'text-ink-3 dark:text-g-text2 hover:text-ink dark:hover:text-g-text hover:bg-surface-2 dark:hover:bg-g-hover'
                  }`}
                title="Emoji picker"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Send or Voice Record Action Button */}
              {text.trim() || attachments.length > 0 ? (
                <button
                  onClick={handleSend}
                  className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg transition-all active:scale-95 flex items-center justify-center dark:bg-gold dark:hover:bg-gold-light dark:text-[#171717]"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="p-2 text-ink-3 dark:text-g-text2 hover:text-accent dark:hover:text-gold hover:bg-accent-soft dark:hover:bg-gold/12 rounded-lg transition-all"
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
