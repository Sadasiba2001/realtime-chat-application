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

  useEffect(() => {
    if (inChatSearchMatchId) {
      const targetEl = document.getElementById(`msg-${inChatSearchMatchId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [inChatSearchMatchId]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-canvas dark:bg-g-bg">
        <div className="p-5 bg-accent-soft dark:bg-gold/10 rounded-2xl mb-5 border border-accent-active dark:border-gold/20">
          <MessageSquare className="w-10 h-10 text-accent dark:text-gold stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-semibold text-ink dark:text-g-text flex items-center gap-2">
          SB Chat Web Pro
          <Sparkles className="hidden w-5 h-5 text-amber-400 fill-amber-400" />
        </h2>
        <p className="text-sm text-ink-2 dark:text-g-text2 mt-2 max-w-sm leading-relaxed">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-ink-3 dark:text-g-text3 bg-surface dark:bg-g-s2 px-3.5 py-1.5 rounded-lg border border-line dark:border-g-line2">
          <Lock className="w-3.5 h-3.5 text-ink-3 dark:text-g-text3" /> End-to-end encrypted connection
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 md:p-6 lg:px-10 space-y-1 ${theme === 'dark' ? 'chat-pattern-dark' : 'chat-pattern-light'
        }`}
    >
      {/* End-to-End Encryption Banner */}
      <div className="flex justify-center mb-4 select-none">
        <div className="bg-surface dark:bg-g-s1 text-ink-2 dark:text-g-text2 text-[11px] font-medium px-3.5 py-1.5 rounded-lg border border-line dark:border-g-line flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-ink-3 dark:text-amber-500" /> Messages are end-to-end encrypted. No one outside of this chat can read them.
        </div>
      </div>

      {/* Pagination History Trigger */}
      {hasMoreHistory && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => loadMoreHistory()}
            disabled={isLoadingHistory}
            className="text-xs font-medium text-accent dark:text-gold hover:bg-accent-soft dark:hover:bg-g-s1 bg-surface dark:bg-g-s1 px-4 py-1.5 rounded-lg border border-line dark:border-g-line flex items-center gap-1.5 transition-all"
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
                <span className="text-[11px] font-medium tracking-wide text-ink-2 dark:text-g-text2 bg-surface dark:bg-g-s1 px-3 py-1 rounded-md border border-line dark:border-g-line uppercase">
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

      {/* Real-time Typing Indicator Bubble */}
      {activeConversation.isTyping && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface dark:bg-g-s2 text-ink-2 dark:text-g-text2 text-xs w-max shadow-softer border border-line dark:border-g-line animate-fade-in my-1 dark:shadow-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-2 dark:bg-g-text3 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-2 dark:bg-g-text3 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-2 dark:bg-g-text3 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="font-medium text-ink-2 dark:text-g-text2">
            {activeConversation.typingUser ? `${activeConversation.typingUser} is typing...` : 'typing...'}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

