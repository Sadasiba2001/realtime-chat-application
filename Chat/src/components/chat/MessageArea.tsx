import React, { useEffect, useRef } from 'react';
import { MessageSquare, Lock, Loader2 } from 'lucide-react';
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-[#090d16] text-center select-none">
        <div className="p-6 bg-sky-100/60 dark:bg-sky-950/40 rounded-full mb-4 shadow-xl">
          <MessageSquare className="w-16 h-16 text-sky-600 dark:text-sky-400 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          SB Chat Web Pro
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>
        <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <Lock className="w-3.5 h-3.5" /> End-to-end encrypted connection
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 md:p-6 ${
        theme === 'dark' ? 'chat-pattern-dark' : 'chat-pattern-light'
      }`}
    >
      {/* End-to-End Encryption Banner */}
      <div className="flex justify-center mb-4 select-none">
        <div className="bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5 shadow-xs">
          <Lock className="w-3 h-3" /> Messages are end-to-end encrypted. No one outside of this chat can read them.
        </div>
      </div>

      {/* Pagination History Trigger */}
      {hasMoreHistory && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => loadMoreHistory()}
            disabled={isLoadingHistory}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline bg-white/80 dark:bg-[#0f172a]/80 px-3.5 py-1.5 rounded-full shadow-xs border border-gray-200/60 dark:border-gray-800/80 flex items-center gap-1.5 transition-all"
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
                <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-[#0f172a]/80 px-3 py-1 rounded-full shadow-xs uppercase">
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
