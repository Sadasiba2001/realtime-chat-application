import React from 'react';
import type { UserPresence } from '../../types/chat.types';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary.utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserPresence;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}


const AVATAR_BG_COLORS = [
  'bg-gradient-to-br from-indigo-500 to-purple-600',
  'bg-gradient-to-br from-sky-500 to-blue-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-violet-500 to-indigo-600',
  'bg-gradient-to-br from-fuchsia-500 to-rose-600',
  'bg-gradient-to-br from-teal-500 to-cyan-600',
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-amber-600 to-red-600',
  'bg-gradient-to-br from-purple-600 to-pink-600',
];

const getAvatarColor = (name: string): string => {
  const clean = (name || '').trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
};

const getInitials = (name: string): string => {
  const clean = (name || '').trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.substring(0, 2).toUpperCase();
  }
  return clean.toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusDotSizes = {
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
    xl: 'w-5 h-5 bottom-1 right-1 border-2',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500',
  };

  const initials = getInitials(name);
  const bgColorClass = getAvatarColor(name);

  // Ignore unsplash placeholder images so user always gets their distinct initial avatar
  const hasValidCustomAvatar =
    Boolean(src) &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    !src.includes('images.unsplash.com');

  const optimizedSrc = getOptimizedCloudinaryUrl(src, size);

  return (
    <div
      className={`relative inline-block flex-shrink-0 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {hasValidCustomAvatar ? (
        <img
          src={optimizedSrc}
          alt={name}
          loading={size === 'sm' || size === 'md' ? 'lazy' : 'eager'}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-xs border border-gray-200 dark:border-gray-700/50`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full ${bgColorClass} text-white font-bold flex items-center justify-center shadow-xs select-none tracking-wider`}
        >
          {initials}
        </div>
      )}


      {showStatus && status && (
        <span
          className={`absolute rounded-full ${statusDotSizes[size]} ${statusColors[status]} border-white dark:border-[#111b21]`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};

