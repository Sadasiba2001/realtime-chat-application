import React, { useState } from 'react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😊', '😂', '🥹', '🥰', '😍', '😎', '😉', '🤔', '😴', '😅', '😇', '😋', '🥳', '🤯', '😭', '🤡', '🤖', '💀'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '🤝', '💪', '✌️', '🤞', '🤙', '🔥', '✨', '❤️', '💖', '💯', '⭐', '🎉'],
  },
  {
    name: 'Objects & Symbols',
    emojis: ['💻', '📱', '📷', '☕', '🚀', '🎨', '📝', '📌', '🎉', '🎁', '💡', '💬', '📞', '📍', '🔒', '🔑', '🎵'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-72 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-50 select-none">
      {/* Category Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#202c33]/50 p-2 gap-1 text-xs">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === idx
                ? 'bg-white dark:bg-[#111b21] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 max-h-56 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelectEmoji(emoji)}
              className="text-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-transform hover:scale-125 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
