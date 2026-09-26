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
    <div className="w-72 bg-surface dark:bg-g-bg2 border border-line dark:border-g-line rounded-xl shadow-menu overflow-hidden animate-fade-in z-50 select-none dark:shadow-g">
      {/* Category Header */}
      <div className="flex border-b border-line dark:border-g-line bg-surface-2 dark:bg-g-s2 p-2 gap-1 text-xs">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${
              activeTab === idx
                ? 'bg-surface dark:bg-g-bg2 text-accent dark:text-gold shadow-xs'
                : 'text-ink-2 dark:text-g-text2 hover:bg-surface-2 dark:hover:bg-g-s3'
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
              className="text-xl p-1.5 hover:bg-surface-2 dark:hover:bg-g-hover rounded-lg transition-transform hover:scale-125 flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
