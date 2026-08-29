import React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface InChatSearchProps {
  onClose: () => void;
  matchCount: number;
  currentMatchIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export const InChatSearch: React.FC<InChatSearchProps> = ({
  onClose,
  matchCount,
  currentMatchIndex,
  onNext,
  onPrev,
}) => {
  const { inChatSearchQuery, setInChatSearchQuery } = useChat();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'PageDown' || (e.key === 'Enter' && !e.shiftKey) || e.key === 'ArrowDown') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'PageUp' || (e.key === 'Enter' && e.shiftKey) || e.key === 'ArrowUp') {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInChatSearchQuery('');
      onClose();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gray-50 dark:bg-[#111b21] border-b border-gray-200 dark:border-gray-800 animate-fade-in z-10 shadow-xs select-none">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search in messages..."
          value={inChatSearchQuery}
          onChange={(e) => setInChatSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-hidden"
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        {inChatSearchQuery.trim() && (
          <span className="font-mono">
            {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No matches'}
          </span>
        )}

        {matchCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Previous match"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Next match"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setInChatSearchQuery('');
            onClose();
          }}
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
