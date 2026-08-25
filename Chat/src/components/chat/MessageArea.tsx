import React, { useEffect, useRef } from 'react';
import { MessageSquare, Lock, Loader2, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { formatDateDivider } from '../../utils/date.utils';

interface MessageAreaProps {
  onToggleSearch: () => void;
  inChatSearchMatchId?: string;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  inChatSearchMatchId,
}) => {
  const {
    activeConversation,
    activeMessages,
    currentUser,
    setReplyTo,
    theme,
    loadMoreHistory,
    isLoadingHistory,
    hasMoreHistory,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    // Only auto-scroll to bottom if new messages are appended, or on initial load
    if (activeMessages.length > prevMessagesLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = activeMessages.length;
  }, [activeMessages.length, activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-[#eef2f6]/40 dark:bg-[#0b0f19]/40">
        <div className="p-6 bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 dark:from-violet-600/20 dark:to-indigo-600/20 rounded-3xl mb-4 shadow-xl border border-violet-500/15">
          <MessageSquare className="w-14 h-14 text-violet-600 dark:text-violet-400 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          SB Chat Web Pro
          <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-white/5 backdrop-blur-xs">
          <Lock className="w-3.5 h-3.5 text-violet-500" /> End-to-end encrypted connection
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-1 ${theme === 'dark' ? 'chat-pattern-dark' : 'chat-pattern-light'
        }`}
    >
      {/* End-to-End Encryption Banner */}
      <div className="flex justify-center mb-4 select-none">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 text-[11px] font-medium px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 shadow-xs">
          <Lock className="w-3 h-3 text-amber-500" /> Messages are end-to-end encrypted. No one outside of this chat can read them.
        </div>
      </div>

      {/* Pagination History Trigger */}
      {hasMoreHistory && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => loadMoreHistory()}
            disabled={isLoadingHistory}
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xs border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 transition-all"
          >
            {isLoadingHistory ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading previous messages...</span>
              </>
            ) : (
              'Load previous messages'
            )}
          </button>
        </div>
      )}

      {/* Date Separators & Messages */}
      {activeMessages.map((msg, index) => {
        const prevMsg = activeMessages[index - 1];
        const showDateDivider =
          !prevMsg || formatDateDivider(prevMsg.createdAt) !== formatDateDivider(msg.createdAt);

        const sender = activeConversation.participants.find((p) => String(p.id) === String(msg.senderId));
        const isOutgoing = String(msg.senderId) === String(currentUser.id);

        return (
          <React.Fragment key={msg.id}>
            {showDateDivider && (
              <div className="flex justify-center my-4 select-none">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-xs border border-slate-200/60 dark:border-white/10 uppercase">
                  {formatDateDivider(msg.createdAt)}
                </span>
              </div>
            )}

            <MessageBubble
              message={msg}
              isOutgoing={isOutgoing}
              sender={sender}
              isGroup={isGroup}
              showSenderName={isGroup}
              onReply={() =>
                setReplyTo({
                  id: msg.id,
                  senderName: sender?.name || 'Contact',
                  text: msg.text,
                })
              }
              isMatch={msg.id === inChatSearchMatchId}
            />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};

